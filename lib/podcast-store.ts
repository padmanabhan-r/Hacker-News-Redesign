import { promises as fs } from "node:fs";
import path from "node:path";

export type DailyManifest = {
  date: string;
  runtimeMs: number;
  storyTitles: string[];
  host: { name: string; persona: string; voiceId: string };
  guest: { name: string; persona: string; voiceId: string };
  segments: { title: string; startMs: number; endMs: number }[];
  generatedAt: string;
};

const STORE_DIR = process.env.PODCAST_STORE_DIR
  ? path.resolve(process.env.PODCAST_STORE_DIR)
  : path.join(process.cwd(), ".podcast-store");

async function ensureDir() {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

function audioPath(date: string) { return path.join(STORE_DIR, `${date}.mp3`); }
function manifestPath(date: string) { return path.join(STORE_DIR, `${date}.json`); }
function scriptPath(date: string) { return path.join(STORE_DIR, `${date}.script.json`); }

export async function putEpisode(date: string, mp3: Buffer, manifest: DailyManifest): Promise<void> {
  await ensureDir();
  await Promise.all([
    fs.writeFile(audioPath(date), mp3),
    fs.writeFile(manifestPath(date), JSON.stringify(manifest, null, 2)),
  ]);
}

export async function getEpisodeAudio(date: string): Promise<Buffer | null> {
  try { return await fs.readFile(audioPath(date)); }
  catch { return null; }
}

export async function getEpisodeManifest(date: string): Promise<DailyManifest | null> {
  try {
    const buf = await fs.readFile(manifestPath(date));
    return JSON.parse(buf.toString("utf8")) as DailyManifest;
  } catch { return null; }
}

export async function putEpisodeScript(date: string, script: unknown): Promise<void> {
  await ensureDir();
  await fs.writeFile(scriptPath(date), JSON.stringify(script, null, 2));
}

export async function getEpisodeScript<T = unknown>(date: string): Promise<T | null> {
  try {
    const buf = await fs.readFile(scriptPath(date));
    return JSON.parse(buf.toString("utf8")) as T;
  } catch { return null; }
}

export async function listRecent(days: number): Promise<DailyManifest[]> {
  await ensureDir();
  const entries = await fs.readdir(STORE_DIR);
  const dates = entries
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .reverse()
    .slice(0, days);
  const manifests = await Promise.all(dates.map(getEpisodeManifest));
  return manifests.filter((m): m is DailyManifest => !!m);
}

export const PODCAST_STORE_DIR = STORE_DIR;
