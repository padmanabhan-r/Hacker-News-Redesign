import { NextRequest, NextResponse } from "next/server";
import { eleven, TTS_MODEL, OUTPUT_FORMAT, HOST_VOICE_SETTINGS, DEFAULT_VOICES } from "@/lib/elevenlabs";
import { hashKey, readCache, writeCache } from "@/lib/render-cache";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { storyId?: number; text?: string; voiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const voiceId = body.voiceId || DEFAULT_VOICES.anchor;
  const trimmed = text.slice(0, 4500);
  const key = hashKey(["tts", voiceId, TTS_MODEL, trimmed]);

  const cached = await readCache(key);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "X-HNPP-Cache": "hit",
      },
    });
  }

  try {
    const audioStream = await eleven().textToSpeech.convert(voiceId, {
      text: trimmed,
      modelId: TTS_MODEL,
      outputFormat: OUTPUT_FORMAT,
      voiceSettings: HOST_VOICE_SETTINGS,
    });

    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream as AsyncIterable<Uint8Array>) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    await writeCache(key, buffer);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "X-HNPP-Cache": "miss",
      },
    });
  } catch (e) {
    console.error("[tts]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
