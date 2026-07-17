import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import type { Document } from "@langchain/core/documents";
import { env } from "../../../../config/env.config";
import { GoogleEmbeddingsService } from "./google-embeddings.service";

export interface RetrievedChunk {
  pageContent: string;
  metadata: Record<string, unknown>;
  score: number;
}

/** Qdrant persistence and similarity search boundary for PDF chunks. */
export class QdrantDocumentStoreService {
  private readonly collectionName = "pdf_documents";
  private readonly client = new QdrantClient({ url: env.QDRANT_URL });

  constructor(private readonly embeddings: GoogleEmbeddingsService) {}

  async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
    const store = new QdrantVectorStore(this.embeddings, {
      url: env.QDRANT_URL,
      collectionName: this.collectionName,
    });
    await store.addVectors(vectors, documents);
  }

  async findSimilar(documentId: string, question: string, limit: number): Promise<RetrievedChunk[]> {
    const vector = await this.embeddings.embedQuery(question);
    const results = await this.client.search(this.collectionName, {
      vector,
      limit,
      with_payload: true,
      filter: { must: [{ key: "metadata.documentId", match: { value: documentId } }] },
    });

    return results.map((result) => ({
      pageContent: (result.payload?.content as string) ?? "",
      metadata: (result.payload?.metadata as Record<string, unknown>) ?? {},
      score: result.score ?? 0,
    }));
  }
}
