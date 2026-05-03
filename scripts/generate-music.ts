/**
 * Pre-generate Eleven Music tracks for Landing/Podcast.
 * Run once: `tsx scripts/generate-music.ts` (or `node --import tsx ...`).
 */

import "dotenv/config";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { promises as fs } from "node:fs";
import path from "node:path";

const TRACKS = [
  {
    file: "landing-loop.mp3",
    prompt: "Warm cinematic tech editorial, hopeful, soft synth pads, slow breathing rhythm, late-afternoon SF vibe. Loopable.",
    durationSeconds: 30,
  },
  {
    file: "intro.mp3",
    prompt: "Modern tech news show open, percussive, electric piano stab, optimistic, end on a confident hold.",
    durationSeconds: 8,
  },
  {
    file: "bed.mp3",
    prompt: "Minimal tech ambient bed, low pulse, no melody, ducks for speech. Loopable, neutral.",
    durationSeconds: 90,
  },
  {
    file: "outro.mp3",
    prompt: "Soft warm resolve, fade to silence, brief electric piano arpeggio.",
    durationSeconds: 6,
  },
];

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  const client = new ElevenLabsClient({ apiKey });
  const outDir = path.resolve("public/audio");
  await fs.mkdir(outDir, { recursive: true });

  for (const t of TRACKS) {
    const dest = path.join(outDir, t.file);
    try {
      const exists = await fs.stat(dest).then(() => true).catch(() => false);
      if (exists) { console.log("SKIP", t.file); continue; }

      console.log("GEN", t.file, `(${t.durationSeconds}s)`);
      const stream = await (client as any).music.compose({
        prompt: t.prompt,
        musicLengthMs: t.durationSeconds * 1000,
      });

      const chunks: Uint8Array[] = [];
      for await (const c of stream as AsyncIterable<Uint8Array>) chunks.push(c);
      await fs.writeFile(dest, Buffer.concat(chunks));
      console.log("OK ", t.file);
    } catch (e) {
      console.error("FAIL", t.file, (e as Error).message);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
