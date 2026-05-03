import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, r2PublicUrl } from "@/lib/r2-client";

const STORE_DIR = path.resolve(
  process.env.PODCAST_STORE_DIR ?? path.join(process.cwd(), ".podcast-store"),
);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PODCAST_PREFIX = "podcast";
const INDEX_KEY = `${PODCAST_PREFIX}/index.json`;

type FileSpec =
  | { kind: "mp3"; date: string; localPath: string; key: string }
  | { kind: "manifest"; date: string; localPath: string; key: string }
  | { kind: "script"; date: string; localPath: string; key: string };

async function existsInR2(key: string): Promise<boolean> {
  const { client, bucket } = r2();
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (e) {
    const err = e as { $metadata?: { httpStatusCode?: number }; name?: string };
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound" || err?.name === "NoSuchKey") return false;
    throw e;
  }
}

async function uploadMp3(spec: FileSpec, dryRun: boolean): Promise<"skip" | "upload"> {
  if (await existsInR2(spec.key)) return "skip";
  if (dryRun) return "upload";
  const buf = await fs.readFile(spec.localPath);
  const { client, bucket } = r2();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: spec.key,
    Body: buf,
    ContentType: "audio/mpeg",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return "upload";
}

async function uploadJson(spec: FileSpec, transform: (parsed: unknown) => unknown, dryRun: boolean): Promise<"skip" | "upload"> {
  if (await existsInR2(spec.key)) return "skip";
  if (dryRun) return "upload";
  const buf = await fs.readFile(spec.localPath);
  const parsed = JSON.parse(buf.toString("utf8"));
  const out = transform(parsed);
  const { client, bucket } = r2();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: spec.key,
    Body: JSON.stringify(out, null, 2),
    ContentType: "application/json",
    CacheControl: "public, max-age=60",
  }));
  return "upload";
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  process.stdout.write(`[migrate] STORE_DIR=${STORE_DIR} dryRun=${dryRun}\n`);

  let entries: string[];
  try {
    entries = await fs.readdir(STORE_DIR);
  } catch (e) {
    process.stderr.write(`[migrate] cannot read store dir: ${(e as Error).message}\n`);
    return 1;
  }

  const dates = new Set<string>();
  const specs: FileSpec[] = [];

  for (const f of entries) {
    if (f.endsWith("-bkp.mp3") || f.startsWith("intro-")) continue;
    const mp3Match = f.match(/^(\d{4}-\d{2}-\d{2})\.mp3$/);
    const scriptMatch = f.match(/^(\d{4}-\d{2}-\d{2})\.script\.json$/);
    const manifestMatch = f.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
    if (mp3Match) {
      const date = mp3Match[1];
      dates.add(date);
      specs.push({ kind: "mp3", date, localPath: path.join(STORE_DIR, f), key: `${PODCAST_PREFIX}/${date}.mp3` });
    } else if (scriptMatch) {
      const date = scriptMatch[1];
      dates.add(date);
      specs.push({ kind: "script", date, localPath: path.join(STORE_DIR, f), key: `${PODCAST_PREFIX}/${date}.script.json` });
    } else if (manifestMatch) {
      const date = manifestMatch[1];
      dates.add(date);
      specs.push({ kind: "manifest", date, localPath: path.join(STORE_DIR, f), key: `${PODCAST_PREFIX}/${date}.json` });
    }
  }

  const dateList = Array.from(dates).filter((d) => DATE_RE.test(d)).sort().reverse();
  process.stdout.write(`[migrate] dates=${dateList.join(",")} files=${specs.length}\n`);

  for (const spec of specs) {
    let action: "skip" | "upload";
    if (spec.kind === "mp3") {
      action = await uploadMp3(spec, dryRun);
    } else if (spec.kind === "manifest") {
      action = await uploadJson(spec, (parsed) => {
        const m = parsed as Record<string, unknown>;
        return { ...m, audioUrl: r2PublicUrl(`${PODCAST_PREFIX}/${spec.date}.mp3`) };
      }, dryRun);
    } else {
      action = await uploadJson(spec, (parsed) => parsed, dryRun);
    }
    process.stdout.write(`[migrate] ${action} ${spec.key}\n`);
  }

  if (!dryRun) {
    const { client, bucket } = r2();
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: INDEX_KEY,
      Body: JSON.stringify({ dates: dateList }, null, 2),
      ContentType: "application/json",
      CacheControl: "public, max-age=60",
    }));
    process.stdout.write(`[migrate] wrote ${INDEX_KEY} (${dateList.length} dates)\n`);
  } else {
    process.stdout.write(`[migrate] dry-run: would write ${INDEX_KEY} with ${dateList.length} dates\n`);
  }

  return 0;
}

main().then((code) => process.exit(code)).catch((e) => {
  process.stderr.write(`[migrate] error: ${(e as Error).stack || (e as Error).message}\n`);
  process.exit(1);
});
