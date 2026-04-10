import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  // Normalize NODE_ENV so accidental casing/whitespace doesn't crash production startup.
  NODE_ENV: z
    .preprocess(
      (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
      z.enum(["development", "test", "production"])
    )
    .catch("development"),
  PORT: z
    .string()
    .default("8000")
    .transform((value) => Number(value)),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  GHL_API_BASE_URL: z.string().default("https://services.leadconnectorhq.com"),
  GHL_API_VERSION: z.string().default("2021-07-28"),
  ACCESS_KEY_SECRET: z.string().min(16, "ACCESS_KEY_SECRET must be at least 16 chars"),
  ACCESS_KEY_COOKIE_NAME: z.string().default("ghl_access_key"),
  ACCESS_KEY_COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  ACCESS_KEY_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  ACCESS_KEY_COOKIE_MAX_AGE_MS: z
    .string()
    .default("2592000000")
    .transform((value) => Number(value)),
  ACCESS_KEY_COOKIE_DOMAIN: z.string().optional(),
  CONTACT_SYNC_PAGE_SIZE: z
    .string()
    .default("100")
    .transform((value) => Number(value)),
  CONTACT_SYNC_INTERVAL_MS: z
    .string()
    .default("900000")
    .transform((value) => Number(value)),
  CONTACT_SYNC_MAX_RETRIES: z
    .string()
    .default("4")
    .transform((value) => Number(value)),
  CONTACT_SYNC_BACKOFF_MS: z
    .string()
    .default("500")
    .transform((value) => Number(value)),
  ENABLE_SYNC_WORKER: z
    .string()
    .default("true")
    .transform((value) => value === "true"),
  GHL_WEBHOOK_SECRET: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000, https://ghl-automation-api.vercel.app/")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment variables: ${errors}`);
}

export const env = parsed.data;
