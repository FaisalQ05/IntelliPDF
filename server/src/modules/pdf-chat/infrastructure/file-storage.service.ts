import { promises as fs } from "fs";
import path from "path";

/** Local upload storage is deliberately isolated so it can be replaced by object storage. */
export class FileStorageService {
  readonly uploadsDirectory = path.resolve(process.cwd(), "uploads");

  async ensureUploadsDirectory(): Promise<void> {
    await fs.mkdir(this.uploadsDirectory, { recursive: true });
  }

  async deleteIfExists(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // Deletion is best-effort, preserving the previous document-delete behavior.
    }
  }
}
