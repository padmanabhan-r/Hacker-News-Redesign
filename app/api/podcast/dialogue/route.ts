import { NextRequest, NextResponse } from "next/server";
import { eleven, DIALOGUE_MODEL, OUTPUT_FORMAT, DRAMATIC_VOICE_SETTINGS } from "@/lib/elevenlabs";
import { getStoryThread } from "@/lib/hn";
import { buildScript, castFromScript } from "@/lib/podcast-script";
import { hashKey, readCache, writeCache, readJsonCache, writeJsonCache } from "@/lib/render-cache";

export const runtime = "nodejs";
export const maxDuration = 180;

type WordTimestamp = { word: string; startMs: number; endMs: number };
type LineMeta = {
  speaker: string;
  persona: string;
  text: string;
  startMs: number;
  endMs: number;
  words?: WordTimestamp[];
};

export async function POST(req: NextRequest) {
  let body: { storyId?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  const storyId = Number(body.storyId);
  if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 });

  try {
    const story = await getStoryThread(storyId);
    const script = buildScript(story);
    const scriptKey = hashKey(["pod", storyId, DIALOGUE_MODEL, ...script.map((l) => l.voiceId + ":" + l.text)]);

    // Cache hit
    const cachedAudio = await readCache(scriptKey);
    const cachedMeta = await readJsonCache<{ lines: LineMeta[]; cast: ReturnType<typeof castFromScript> }>(scriptKey);
    if (cachedAudio && cachedMeta) {
      return NextResponse.json({
        audioUrl: `/api/podcast/audio/${scriptKey}`,
        lines: cachedMeta.lines,
        cast: cachedMeta.cast,
        storyTitle: story.title,
      });
    }

    // Generate via Text-to-Dialogue
    const inputs = script.map((l) => ({ text: l.text, voiceId: l.voiceId }));

    let audioBuffer: Buffer;
    let lineMetas: LineMeta[];

    try {
      const dlg: any = await (eleven() as any).textToDialogue.convertWithTimestamps({
        inputs,
        modelId: DIALOGUE_MODEL,
        outputFormat: OUTPUT_FORMAT,
        settings: DRAMATIC_VOICE_SETTINGS,
      });

      const audioB64: string = dlg.audioBase64 ?? dlg.audio_base64 ?? dlg.audio;
      audioBuffer = Buffer.from(audioB64, "base64");

      // Map voiceSegments back to script lines (they should be in input order)
      const segments: any[] = dlg.voiceSegments ?? dlg.voice_segments ?? dlg.segments ?? [];
      lineMetas = script.map((l, i) => {
        const seg = segments[i];
        const start = (seg?.startTimeSeconds ?? seg?.start_time_seconds ?? 0) * 1000;
        const end = (seg?.endTimeSeconds ?? seg?.end_time_seconds ?? 0) * 1000;
        return { speaker: l.speaker, persona: l.persona, text: l.text, startMs: start, endMs: end };
      });
    } catch (dlgErr) {
      console.warn("[podcast] dialogue endpoint failed, falling back to per-line TTS", dlgErr);
      // Fallback: per-line streaming TTS, concatenated
      const concat: Uint8Array[] = [];
      let cursorMs = 0;
      lineMetas = [];
      for (const l of script) {
        const stream = await eleven().textToSpeech.convert(l.voiceId, {
          text: l.text,
          modelId: "eleven_multilingual_v2",
          outputFormat: OUTPUT_FORMAT,
        });
        const parts: Uint8Array[] = [];
        for await (const c of stream as AsyncIterable<Uint8Array>) parts.push(c);
        const buf = Buffer.concat(parts);
        const approxDuration = Math.max(2000, l.text.length * 60); // very rough
        lineMetas.push({
          speaker: l.speaker, persona: l.persona, text: l.text,
          startMs: cursorMs, endMs: cursorMs + approxDuration,
        });
        cursorMs += approxDuration;
        concat.push(buf);
      }
      audioBuffer = Buffer.concat(concat);
    }

    await writeCache(scriptKey, audioBuffer);

    // Forced alignment for word-level timing on the merged audio
    try {
      const fullText = script.map((l) => l.text.replace(/\[[^\]]+\]/g, "")).join(" ");
      const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/mpeg" });
      const file = new File([audioBlob], "episode.mp3", { type: "audio/mpeg" });
      const align: any = await (eleven() as any).forcedAlignment.create({
        file,
        text: fullText,
      });
      const words: any[] = align.words ?? [];
      // Slice words back into lines by line text length
      const lineWords: WordTimestamp[][] = lineMetas.map(() => []);
      let wi = 0;
      lineMetas.forEach((line, idx) => {
        const lineCleanWords = line.text.replace(/\[[^\]]+\]/g, "").split(/\s+/).filter(Boolean).length;
        for (let k = 0; k < lineCleanWords && wi < words.length; k++, wi++) {
          const w = words[wi];
          lineWords[idx].push({
            word: w.text ?? w.word ?? "",
            startMs: (w.start ?? w.start_seconds ?? 0) * 1000,
            endMs: (w.end ?? w.end_seconds ?? 0) * 1000,
          });
        }
      });
      lineMetas.forEach((l, i) => { l.words = lineWords[i]; });
    } catch (alignErr) {
      console.warn("[podcast] alignment failed:", alignErr);
    }

    const cast = castFromScript(script);
    await writeJsonCache(scriptKey, { lines: lineMetas, cast });

    return NextResponse.json({
      audioUrl: `/api/podcast/audio/${scriptKey}`,
      lines: lineMetas,
      cast,
      storyTitle: story.title,
    });
  } catch (e) {
    console.error("[podcast]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
