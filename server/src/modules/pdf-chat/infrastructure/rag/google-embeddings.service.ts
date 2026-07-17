import { GoogleGenAI } from "@google/genai";
import { Embeddings } from "@langchain/core/embeddings";
import { env } from "../../../../config/env.config";

const MODEL = "gemini-embedding-001";
const BATCH_SIZE = 20;

/** Adapter that keeps the Google embedding provider out of application orchestration. */
export class GoogleEmbeddingsService extends Embeddings {
  private readonly client = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });

  constructor() {
    super({});
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let offset = 0; offset < texts.length; offset += BATCH_SIZE) {
      vectors.push(...await Promise.all(texts.slice(offset, offset + BATCH_SIZE).map((text) => this.embedQuery(text))));
    }
    return vectors;
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await this.client.models.embedContent({ model: MODEL, contents: text });
    return response.embeddings?.[0].values ?? [];
  }
}
