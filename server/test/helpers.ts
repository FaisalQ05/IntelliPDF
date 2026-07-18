export const tx = {} as any;

export const user = {
  id: "8d94ee1a-f0f6-4cc1-9f90-cc26a4d4ef1e",
  email: "user@example.com",
  name: "Test User",
  passwordHash: "hash",
  role: "USER",
  provider: "LOCAL",
};

export const document = {
  id: "5d59a3ee-6351-4bc2-81e3-3beb6033888a",
  userId: user.id,
  filename: "handbook.pdf",
  fileSize: 1024,
  filePath: "/tmp/handbook.pdf",
  status: "QUEUED",
  progress: 0,
  error: null,
};

export async function* streamOf<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) yield item;
}
