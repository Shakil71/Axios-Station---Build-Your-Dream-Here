import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

export interface StorageDriver {
  readonly name: "local" | "s3";
  put(key: string, body: Buffer, contentType: string): Promise<{ url: string }>;
  remove(key: string): Promise<void>;
}

class LocalStorage implements StorageDriver {
  readonly name = "local" as const;
  private root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), env.LOCAL_UPLOAD_DIR);

  private resolve(key: string) {
    const full = path.resolve(/*turbopackIgnore: true*/ this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error("Invalid storage key");
    return full;
  }

  async put(key: string, body: Buffer) {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body, { flag: "wx" });
    // Files under public/ are served by Next.js (and by Nginx in production).
    const publicRoot = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "public");
    const rel = path.relative(publicRoot, full).split(path.sep).join("/");
    return { url: `/${rel}` };
  }

  async remove(key: string) {
    await unlink(this.resolve(key)).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== "ENOENT") throw e;
    });
  }
}

class S3Storage implements StorageDriver {
  readonly name = "s3" as const;
  private client: S3Client;
  private bucket: string;

  constructor() {
    if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new Error("S3 storage selected but S3_BUCKET / credentials are not configured");
    }
    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      region: env.S3_REGION ?? "us-east-1",
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: Boolean(env.S3_ENDPOINT),
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
    });
  }

  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    const base = (env.S3_PUBLIC_URL ?? `${env.S3_ENDPOINT ?? ""}/${this.bucket}`).replace(/\/$/, "");
    return { url: `${base}/${key}` };
  }

  async remove(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

let driver: StorageDriver | undefined;
export function getStorage(): StorageDriver {
  driver ??= env.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage();
  return driver;
}

export function getStorageByName(name: string): StorageDriver {
  const current = getStorage();
  if (current.name === name) return current;
  return name === "s3" ? new S3Storage() : new LocalStorage();
}
