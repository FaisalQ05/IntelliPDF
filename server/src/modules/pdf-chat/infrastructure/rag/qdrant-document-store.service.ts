import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import type { Document } from "@langchain/core/documents";
import { v5 as uuidv5 } from "uuid";
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
  private readonly pointNamespace = "c9b1a928-3a96-4bb8-8a58-8fb61c9dc768";

  constructor(private readonly embeddings: GoogleEmbeddingsService) {}

  async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
    const store = new QdrantVectorStore(this.embeddings, {
      url: env.QDRANT_URL,
      collectionName: this.collectionName,
    });
    await store.addVectors(vectors, documents, {
      // Reprocessing a document upserts the same points instead of duplicating them.
      ids: documents.map((document, index) => {
        const documentId = String(document.metadata.documentId ?? "unknown");
        const chunkIndex = Number(document.metadata.chunkIndex ?? index);
        return uuidv5(`${documentId}:${chunkIndex}`, this.pointNamespace);
      }),
    });
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    const collection = await this.client.collectionExists(this.collectionName);
    if (!collection.exists) return;

    await this.client.delete(this.collectionName, {
      wait: true,
      filter: { must: [{ key: "metadata.documentId", match: { value: documentId } }] },
    });
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
