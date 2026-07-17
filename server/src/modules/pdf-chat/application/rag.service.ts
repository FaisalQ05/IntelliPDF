import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatGroq } from "@langchain/groq";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { env } from "../../../config/env.config";
import { AppException } from "../../../common/exceptions";
import { DocumentStatus } from "../../../../generated/prisma/client";
import {
  GoogleEmbeddingsService,
  QdrantDocumentStoreService,
  type RetrievedChunk,
} from "../infrastructure/rag";

export interface CitationChunk {
  pageContent: string;
  metadata: { documentId?: string; page?: number; loc?: { pageNumber?: number; lines?: { from?: number; to?: number } }; source?: string; [key: string]: unknown };
  score?: number;
}

type ChatHistoryItem = { role: string; content: string };
type ProgressCallback = (status: DocumentStatus, progress: number, message?: string) => Promise<void>;

const EMBEDDING_BATCH_SIZE = 20;
const SCORE_THRESHOLD = 0.5;
const RETRIEVAL_K = 6;
const CHUNK_OPTIONS = {
  chunkSize: 1500,
  chunkOverlap: 300,
  separators: ["\n\n", "\n", ". ", "! ", "? ", " ", ""],
};

/**
 * Application-facing RAG façade. Provider-specific embedding and Qdrant access
 * live in infrastructure; this class only coordinates the ingestion and QA use cases.
 */
export class RagService {
  private readonly embeddings = new GoogleEmbeddingsService();
  private readonly documentStore = new QdrantDocumentStoreService(this.embeddings);
  private readonly llm = new ChatGroq({
    apiKey: env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
  });

  async processDocument(filePath: string, documentId: string, onProgress?: ProgressCallback): Promise<void> {
    await onProgress?.("PROCESSING", 5, "Preparing document");
    const pages = await new PDFLoader(filePath).load();
    await onProgress?.("PROCESSING", 15, `Parsed ${pages.length} page${pages.length === 1 ? "" : "s"}`);

    const chunks = await new RecursiveCharacterTextSplitter(CHUNK_OPTIONS).splitDocuments(pages);
    await onProgress?.("PROCESSING", 30, `Split into ${chunks.length} chunk${chunks.length === 1 ? "" : "s"}`);

    const documents = chunks.map((chunk) => ({
      ...chunk,
      metadata: { ...chunk.metadata, documentId },
    }));

    await onProgress?.("EMBEDDING", 35, `Generating embeddings (${chunks.length} chunks)`);
    const vectors = await this.embedChunks(documents, onProgress);
    await onProgress?.("INDEXING", 82, "Uploading to vector store");
    await this.documentStore.addVectors(vectors, documents);
    await onProgress?.("INDEXING", 98, "Finalising index");
  }

  async askQuestion(documentId: string, question: string, history: ChatHistoryItem[]): Promise<string> {
    const { context } = await this.retrieveWithContext(documentId, question, history);
    if (!context.trim()) return "I don't know.";
    return this.invokeQa(context, question, this.toMessages(history));
  }

  async askQuestionStream(documentId: string, question: string, history: ChatHistoryItem[]) {
    const { context, citations } = await this.retrieveWithContext(documentId, question, history);
    if (!context.trim()) return { stream: this.unknownAnswerStream(), documents: [] as CitationChunk[] };

    try {
      const chain = this.createQaChain(this.toMessages(history));
      return { stream: await chain.stream({ context, input: question }), documents: citations };
    } catch (error) {
      throw this.providerError(error);
    }
  }

  private async retrieveWithContext(documentId: string, question: string, history: ChatHistoryItem[]) {
    const messages = this.toMessages(history);
    const standaloneQuestion = await this.contextualizeQuestion(question, messages);
    const results = await this.documentStore.findSimilar(documentId, standaloneQuestion, RETRIEVAL_K);
    const citations = results.filter(({ score }) => score >= SCORE_THRESHOLD).map(this.toCitation);
    return { citations, context: citations.map(({ pageContent }) => pageContent).join("\n\n") };
  }

  private async embedChunks(
    chunks: { pageContent: string }[],
    onProgress?: ProgressCallback
  ): Promise<number[][]> {
    const vectors: number[][] = [];
    const totalBatches = Math.max(1, Math.ceil(chunks.length / EMBEDDING_BATCH_SIZE));
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
      const start = batchIndex * EMBEDDING_BATCH_SIZE;
      const texts = chunks.slice(start, start + EMBEDDING_BATCH_SIZE).map(({ pageContent }) => pageContent);
      vectors.push(...await this.embeddings.embedDocuments(texts));
      const progress = Math.round(35 + ((batchIndex + 1) / totalBatches) * 45);
      await onProgress?.("EMBEDDING", progress, `Embedding batch ${batchIndex + 1}/${totalBatches}`);
    }
    return vectors;
  }

  private async contextualizeQuestion(question: string, history: (HumanMessage | AIMessage)[]): Promise<string> {
    if (history.length === 0) return question;
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "Given the chat history and latest user question, formulate a standalone question. Do not answer it; return it unchanged if no reformulation is needed."],
      ...history,
      ["human", "{input}"],
    ]);
    return RunnableSequence.from([prompt, this.llm, new StringOutputParser()]).invoke({ input: question });
  }

  private createQaChain(history: (HumanMessage | AIMessage)[]) {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an expert AI assistant that answers questions strictly based on the provided context extracted from a PDF document.

Rules:
1. Answer ONLY from the provided context. Do not use outside knowledge or make up information.
2. If the answer cannot be found in the context, respond with exactly: "I don't know."
3. Be concise and precise. Use bullet points or numbered lists when the answer contains multiple items or steps.
4. Quote relevant passages from the context when it adds clarity.
5. Never speculate or extrapolate beyond what the context states.

Context:
{context}`],
      ...history,
      ["human", "{input}"],
    ]);
    return RunnableSequence.from([prompt, this.llm, new StringOutputParser()]);
  }

  private async invokeQa(context: string, question: string, history: (HumanMessage | AIMessage)[]): Promise<string> {
    try {
      return await this.createQaChain(history).invoke({ context, input: question });
    } catch (error) {
      throw this.providerError(error);
    }
  }

  private toMessages(history: ChatHistoryItem[]): (HumanMessage | AIMessage)[] {
    return history.map(({ role, content }) => role === "USER" ? new HumanMessage(content) : new AIMessage(content));
  }

  private toCitation = ({ pageContent, metadata, score }: RetrievedChunk): CitationChunk => ({
    pageContent,
    metadata: metadata as CitationChunk["metadata"],
    score: Math.round(score * 100) / 100,
  });

  private async *unknownAnswerStream(): AsyncGenerator<string> {
    yield "I don't know.";
  }

  private providerError(error: unknown): AppException {
    console.error("[RagService] AI Communication Error:", error);
    return new AppException("Failed to communicate with AI provider", 502);
  }
}
