import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { r2, r2PublicUrl } from "./r2-client";

export type DailyManifest = {
  date: string;
  runtimeMs: number;
  storyTitles: string[];
  host: { name: string; persona: string; voiceId: string };
  guest: { name: string; persona: string; voiceId: string };
  segments: { title: string; startMs: number; endMs: number }[];
  generatedAt: string;
  audioUrl?: string;
};

const PODCAST_PREFIX = "podcast";
const INDEX_KEY = `${PODCAST_PREFIX}/index.json`;

function audioKey(date: string) { return `${PODCAST_PREFIX}/${date}.mp3`; }
function manifestKey(date: string) { return `${PODCAST_PREFIX}/${date}.json`; }
function scriptKey(date: string) { return `${PODCAST_PREFIX}/${date}.script.json`; }

async function streamToBuffer(out: GetObjectCommandOutput): Promise<Buffer> {
  const body = out.Body as { transformToByteArray?: () => Promise<Uint8Array> } | undefined;
  if (!body?.transformToByteArray) throw new Error("R2 GetObject Body missing");
  return Buffer.from(await body.transformToByteArray());
}

function isNotFound(e: unknown): boolean {
  const err = e as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
  return err?.name === "NoSuchKey" || err?.Code === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404;
}

async function getJson<T>(key: string): Promise<T | null> {
  const { client, bucket } = r2();
  try {
    const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const buf = await streamToBuffer(out);
    return JSON.parse(buf.toString("utf8")) as T;
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

async function putJson(key: string, value: unknown): Promise<void> {
  const { client, bucket } = r2();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(value, null, 2),
    ContentType: "application/json",
    CacheControl: "public, max-age=60",
  }));
}

async function readIndex(): Promise<{ dates: string[] }> {
  return (await getJson<{ dates: string[] }>(INDEX_KEY)) ?? { dates: [] };
}

async function writeIndex(dates: string[]): Promise<void> {
  const unique = Array.from(new Set(dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))));
  unique.sort().reverse();
  await putJson(INDEX_KEY, { dates: unique });
}

export async function putEpisode(date: string, mp3: Buffer, manifest: DailyManifest): Promise<void> {
  const enriched: DailyManifest = { ...manifest, audioUrl: r2PublicUrl(audioKey(date)) };
  const { client, bucket } = r2();
  await Promise.all([
    client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: audioKey(date),
      Body: mp3,
      ContentType: "audio/mpeg",
      CacheControl: "public, max-age=31536000, immutable",
    })),
    putJson(manifestKey(date), enriched),
  ]);
  const index = await readIndex();
  if (!index.dates.includes(date)) {
    await writeIndex([date, ...index.dates]);
  }
}

export async function getEpisodeAudio(date: string): Promise<Buffer | null> {
  const { client, bucket } = r2();
  try {
    const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: audioKey(date) }));
    return await streamToBuffer(out);
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

export async function getEpisodeManifest(date: string): Promise<DailyManifest | null> {
  return getJson<DailyManifest>(manifestKey(date));
}

export async function putEpisodeScript(date: string, script: unknown): Promise<void> {
  await putJson(scriptKey(date), script);
}

export async function getEpisodeScript<T = unknown>(date: string): Promise<T | null> {
  return getJson<T>(scriptKey(date));
}

export async function listRecent(days: number): Promise<DailyManifest[]> {
  const { dates } = await readIndex();
  const top = dates.slice(0, days);
  const manifests = await Promise.all(top.map(getEpisodeManifest));
  return manifests.filter((m): m is DailyManifest => !!m);
}
