import { createHash } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { r2 } from "./r2-client";

const CACHE_PREFIX = "cache";

export function hashKey(parts: (string | number)[]): string {
  const h = createHash("sha256");
  h.update(parts.map(String).join("\n"));
  return h.digest("hex").slice(0, 24);
}

function cacheKey(key: string, ext: string) { return `${CACHE_PREFIX}/${key}.${ext}`; }

async function streamToBuffer(out: GetObjectCommandOutput): Promise<Buffer> {
  const body = out.Body as { transformToByteArray?: () => Promise<Uint8Array> } | undefined;
  if (!body?.transformToByteArray) throw new Error("R2 GetObject Body missing");
  return Buffer.from(await body.transformToByteArray());
}

function isNotFound(e: unknown): boolean {
  const err = e as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
  return err?.name === "NoSuchKey" || err?.Code === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404;
}

export async function readCache(key: string, ext = "mp3"): Promise<Buffer | null> {
  const { client, bucket } = r2();
  try {
    const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: cacheKey(key, ext) }));
    return await streamToBuffer(out);
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

export async function writeCache(key: string, data: Buffer | Uint8Array, ext = "mp3"): Promise<void> {
  const { client, bucket } = r2();
  const body = data instanceof Buffer ? data : Buffer.from(data);
  const contentType = ext === "mp3" ? "audio/mpeg" : "application/json";
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: cacheKey(key, ext),
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=86400",
  }));
}

export async function readJsonCache<T>(key: string): Promise<T | null> {
  const buf = await readCache(key, "json");
  if (!buf) return null;
  try { return JSON.parse(buf.toString("utf8")) as T; } catch { return null; }
}

export async function writeJsonCache(key: string, data: unknown): Promise<void> {
  await writeCache(key, Buffer.from(JSON.stringify(data)), "json");
}
