/**
 * Generate TTS intro lines for podcast episodes.
 * Run: tsx scripts/gen-intros.ts
 * Output: .podcast-store/intro-2026-05-01.mp3, intro-2026-05-02.mp3
 */

import "dotenv/config";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { promises as fs } from "node:fs";
import path from "node:path";

const BRIELLE = "6u6JbqKdaQy89ENzLSju";
const MODEL = "eleven_flash_v2_5";
const OUT_DIR = path.join(process.cwd(), ".podcast-store");

const INTROS = [
  { file: "intro-2026-05-02.mp3", text: "Welcome to HN++ Pod for Saturday May 2nd" },
  { file: "intro-2026-05-01.mp3", text: "Welcome to HN++ Pod for Friday May 1st" },
];

async function main() {
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });

  for (const { file, text } of INTROS) {
    console.log(`Generating: "${text}"`);
    const stream = await client.textToSpeech.stream(BRIELLE, {
      text,
      modelId: MODEL,
      outputFormat: "mp3_44100_128",
      voiceSettings: { stability: 0.4, similarityBoost: 0.95, style: 0.15, useSpeakerBoost: true },
    });

    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as unknown as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const out = path.join(OUT_DIR, file);
    await fs.writeFile(out, Buffer.concat(chunks));
    console.log(`  → ${out}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
