import "server-only";
import { z } from "zod";

const bool = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const optionalStr = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).default("mysql://root@127.0.0.1:3306/axios_station"),
  REDIS_URL: optionalStr,
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  /** Optional IndexNow key (8–128 letters, digits or dashes). When set in production, new and updated pages are announced to Bing, Yandex and other IndexNow search engines. */
  INDEXNOW_KEY: z.string().regex(/^[a-zA-Z0-9-]{8,128}$/).optional().or(z.literal("")),
  AUTH_SECRET: optionalStr,
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().default("public/uploads"),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  S3_ENDPOINT: optionalStr,
  S3_REGION: optionalStr,
  S3_BUCKET: optionalStr,
  S3_ACCESS_KEY_ID: optionalStr,
  S3_SECRET_ACCESS_KEY: optionalStr,
  S3_PUBLIC_URL: optionalStr,
  SMTP_HOST: optionalStr,
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: bool,
  SMTP_USER: optionalStr,
  SMTP_PASSWORD: optionalStr,
  MAIL_FROM: z.string().default("Axios Station <no-reply@localhost>"),
  LEAD_NOTIFICATION_EMAIL: optionalStr,
  AI_PROVIDER: z.enum(["none", "openai", "anthropic"]).default("none"),
  OPENAI_API_KEY: optionalStr,
  ANTHROPIC_API_KEY: optionalStr,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", z.flattenError(parsed.error).fieldErrors);
  throw new Error("Invalid environment configuration");
}

/** Server-only environment. Never import from client components. */
export const env = parsed.data;

if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) {
  console.error(
    "[env] AUTH_SECRET is missing or too short (min 32 chars) — admin sign-in will not work. " +
      "Generate one with:  npx auth secret   or   openssl rand -base64 32",
  );
}
export const isProd = env.NODE_ENV === "production";
