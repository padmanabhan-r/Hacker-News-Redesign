import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const CACHE_DIR = path.join(os.tmpdir(), "hnpp-audio");

async function ensureDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

export function hashKey(parts: (string | number)[]): string {
  const h = createHash("sha256");
  h.update(parts.map(String).join("\n"));
  return h.digest("hex").slice(0, 24);
}

export async function readCache(key: string, ext = "mp3"): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(CACHE_DIR, `${key}.${ext}`));
  } catch {
    return null;
  }
}

export async function writeCache(key: string, data: Buffer | Uint8Array, ext = "mp3"): Promise<void> {
  await ensureDir();
  await fs.writeFile(path.join(CACHE_DIR, `${key}.${ext}`), data);
}

export async function readJsonCache<T>(key: string): Promise<T | null> {
  const buf = await readCache(key, "json");
  if (!buf) return null;
  try { return JSON.parse(buf.toString("utf8")) as T; } catch { return null; }
}

export async function writeJsonCache(key: string, data: unknown): Promise<void> {
  await writeCache(key, Buffer.from(JSON.stringify(data)), "json");
}

export const CACHE_DIR_PATH = CACHE_DIR;
