import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// 1. Load base env first
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

// 2. Override with local env
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ORIGIN: z.string().min(1, "ORIGIN is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(100), // 100 requests per windowMs
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  GOOGLE_API_KEY: z.string().min(1, "GOOGLE_API_KEY is required"),
  QDRANT_URL: z.string().default("http://qdrant:6333"),
  REDIS_URL: z.string().default("redis://redis:6379"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
