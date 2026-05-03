import { NextRequest, NextResponse } from "next/server";
import { eleven, STT_MODEL } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const file = fd.get("audio") as File | null;
    if (!file) return NextResponse.json({ error: "audio required" }, { status: 400 });

    const result = await eleven().speechToText.convert({
      file,
      modelId: STT_MODEL,
    });
    return NextResponse.json({ text: (result as { text?: string })?.text ?? "" });
  } catch (e) {
    console.error("[stt]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
