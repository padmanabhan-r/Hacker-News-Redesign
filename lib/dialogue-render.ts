import { eleven, DIALOGUE_MODEL, FLASH_MODEL, OUTPUT_FORMAT, NARRATOR_VOICE_SETTINGS } from "./elevenlabs";
import type { DialogueScript, DialogueLine } from "./dialogue-script";

export type RenderedDialogue = {
  mp3: Buffer;
  runtimeMs: number;
  segmentTimings: { title: string; startMs: number; endMs: number }[];
};

const DIALOGUE_CHAR_BUDGET = 1900;

type FlatLine = DialogueLine & { sectionIdx: number; voiceId: string; renderedText: string };

function emotionPrefix(line: DialogueLine): string {
  if (!line.emotion) return "";
  const e = line.emotion.replace(/[\[\]]/g, "").trim().toLowerCase();
  if (!e) return "";
  return `[${e}] `;
}

function flatten(script: DialogueScript, voices: { host: string; guest: string }): FlatLine[] {
  const out: FlatLine[] = [];
  // section indices: 0 = intro, 1..N = segments, N+1 = outro
  const sections: { lines: DialogueLine[] }[] = [
    { lines: script.intro },
    ...script.segments.map((s) => ({ lines: s.lines })),
    { lines: script.outro },
  ];
  sections.forEach((sec, sIdx) => {
    sec.lines.forEach((line) => {
      const voiceId = line.speaker === "A" ? voices.host : voices.guest;
      const renderedText = `${emotionPrefix(line)}${line.text.trim()}`;
      out.push({ ...line, sectionIdx: sIdx, voiceId, renderedText });
    });
  });
  return out;
}

function chunkLines(lines: FlatLine[], budget = DIALOGUE_CHAR_BUDGET): FlatLine[][] {
  const chunks: FlatLine[][] = [];
  let cur: FlatLine[] = [];
  let len = 0;
  for (const line of lines) {
    const t = line.renderedText.length;
    if (cur.length && len + t > budget) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
    if (t > budget) {
      // single line too long — push solo (will be truncated by API but better than skipping)
      if (cur.length) { chunks.push(cur); cur = []; len = 0; }
      chunks.push([{ ...line, renderedText: line.renderedText.slice(0, budget) }]);
      continue;
    }
    cur.push(line);
    len += t;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

type DialogueResult = {
  audio: Buffer;
  /** end time in ms for each input line within this chunk's audio */
  endTimesMs: number[];
};

async function renderDialogueChunk(chunk: FlatLine[]): Promise<DialogueResult> {
  const inputs = chunk.map((l) => ({ text: l.renderedText, voiceId: l.voiceId }));
  try {
    const dlg = await (eleven() as unknown as {
      textToDialogue: { convertWithTimestamps: (req: unknown) => Promise<unknown> };
    }).textToDialogue.convertWithTimestamps({
      inputs,
      modelId: DIALOGUE_MODEL,
      outputFormat: OUTPUT_FORMAT,
    });
    const r = dlg as Record<string, unknown>;
    const audioB64 = (r.audioBase64 ?? r.audio_base64 ?? r.audio) as string | undefined;
    if (!audioB64) throw new Error("no audio in dialogue response");
    const audio = Buffer.from(audioB64, "base64");
    const segs = (r.voiceSegments ?? r.voice_segments ?? r.segments ?? []) as Array<Record<string, unknown>>;
    const endTimesMs = chunk.map((_, i) => {
      // prefer dialogue_input_index match; fall back to positional
      const s = segs.find(
        (seg) => ((seg.dialogueInputIndex ?? seg.dialogue_input_index) as number) === i
      ) ?? segs[i];
      const end = (s?.endTimeSeconds ?? s?.end_time_seconds ?? 0) as number;
      return end * 1000;
    });
    return { audio, endTimesMs };
  } catch (err) {
    console.warn("[dialogue-render] dialogue chunk failed, falling back to per-line TTS:", (err as Error).message);
    return await renderChunkFallback(chunk);
  }
}

async function renderChunkFallback(chunk: FlatLine[]): Promise<DialogueResult> {
  const parts: Uint8Array[] = [];
  const endTimesMs: number[] = [];
  let cursor = 0;
  for (const line of chunk) {
    const stream = await eleven().textToSpeech.convert(line.voiceId, {
      text: line.renderedText.replace(/\[[^\]]+\]\s*/, ""),
      modelId: FLASH_MODEL,
      outputFormat: OUTPUT_FORMAT,
      voiceSettings: NARRATOR_VOICE_SETTINGS,
    });
    const slice: Uint8Array[] = [];
    for await (const c of stream as unknown as AsyncIterable<Uint8Array>) slice.push(c);
    parts.push(...slice);
    // very rough wpm-based duration estimate (~16 chars/sec speaking rate)
    const approxMs = Math.max(1500, Math.round((line.renderedText.length / 16) * 1000));
    cursor += approxMs;
    endTimesMs.push(cursor);
  }
  return { audio: Buffer.concat(parts), endTimesMs };
}

function chunkDurationMs(endTimesMs: number[]): number {
  // Use last segment end as chunk duration. Add small tail buffer (200ms)
  // to account for natural trailing silence ElevenLabs appends after last word.
  return (endTimesMs[endTimesMs.length - 1] ?? 0) + 200;
}

export async function renderDialogue(
  script: DialogueScript,
  voices: { host: string; guest: string },
): Promise<RenderedDialogue> {
  const flat = flatten(script, voices);
  const chunks = chunkLines(flat);

  const audioBuffers: Buffer[] = [];
  // running offset (ms) across concatenated chunks
  let offsetMs = 0;
  // map flat line index -> end time ms (absolute)
  const lineEndAbsMs = new Map<number, number>();
  // build line index per chunk
  let flatIdx = 0;

  for (const chunk of chunks) {
    const { audio, endTimesMs } = await renderDialogueChunk(chunk);
    audioBuffers.push(audio);
    for (let i = 0; i < chunk.length; i++) {
      lineEndAbsMs.set(flatIdx, offsetMs + endTimesMs[i]);
      flatIdx++;
    }
    offsetMs += chunkDurationMs(endTimesMs);
  }

  const mp3 = Buffer.concat(audioBuffers);

  // Compute per-segment timings using sectionIdx boundaries
  // sectionIdx: 0 = intro, 1..N = segments, lastIdx = outro
  const segmentTimings: { title: string; startMs: number; endMs: number }[] = [];
  const numSegments = script.segments.length;

  // First absolute index per section
  const firstIdx: number[] = new Array(numSegments + 2).fill(-1);
  const lastIdx: number[] = new Array(numSegments + 2).fill(-1);
  flat.forEach((l, i) => {
    if (firstIdx[l.sectionIdx] === -1) firstIdx[l.sectionIdx] = i;
    lastIdx[l.sectionIdx] = i;
  });

  // Intro chapter
  if (firstIdx[0] !== -1) {
    segmentTimings.push({
      title: "Intro",
      startMs: 0,
      endMs: lineEndAbsMs.get(lastIdx[0]) ?? 0,
    });
  }
  // Story segments
  for (let s = 0; s < numSegments; s++) {
    const sIdx = s + 1;
    if (firstIdx[sIdx] === -1) continue;
    const prevEnd = lineEndAbsMs.get(firstIdx[sIdx] - 1) ?? 0;
    segmentTimings.push({
      title: script.segments[s].title,
      startMs: prevEnd,
      endMs: lineEndAbsMs.get(lastIdx[sIdx]) ?? prevEnd,
    });
  }
  // Outro chapter
  const outroIdx = numSegments + 1;
  if (firstIdx[outroIdx] !== -1) {
    const prevEnd = lineEndAbsMs.get(firstIdx[outroIdx] - 1) ?? 0;
    segmentTimings.push({
      title: "Sign-off",
      startMs: prevEnd,
      endMs: lineEndAbsMs.get(lastIdx[outroIdx]) ?? prevEnd,
    });
  }

  return { mp3, runtimeMs: offsetMs, segmentTimings };
}
