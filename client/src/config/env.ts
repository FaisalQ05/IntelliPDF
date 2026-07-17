import { z } from "zod"

/**
 * 1. Define schema (single source of truth)
 */
const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_GOOGLE_CLIENT_ID: z.string(),
})

/**
 * 2. Validate once at boot
 */
const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})

console.log({ parsed })

if (!parsed.success) {
  console.log({ error: parsed.error })
  console.error("❌ Invalid environment variables:")
  console.error(z.treeifyError(parsed.error).errors)

  throw new Error("Invalid environment variables")
}

/**
 * 3. Export typed env
 */
export const env = parsed.data
