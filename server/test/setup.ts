import { afterEach, vi } from "vitest";

Object.assign(process.env, {
  NODE_ENV: "test",
  PORT: "4000",
  DATABASE_URL: "postgresql://test:test@localhost:5432/intellipdf_test?schema=public",
  ORIGIN: "http://localhost:5173",
  JWT_ACCESS_SECRET: "test-access-secret",
  JWT_REFRESH_SECRET: "test-refresh-secret",
  GOOGLE_CLIENT_ID: "test-google-client",
  GOOGLE_CLIENT_SECRET: "test-google-secret",
  GOOGLE_API_KEY: "test-google-api-key",
  GROQ_API_KEY: "test-groq-api-key",
  QDRANT_URL: "http://localhost:6333",
  REDIS_URL: "redis://localhost:6379",
});

afterEach(() => vi.clearAllMocks());
