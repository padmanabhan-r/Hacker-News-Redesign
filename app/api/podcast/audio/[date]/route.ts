import { NextRequest, NextResponse } from "next/server";
import { getEpisodeAudio } from "@/lib/podcast-store";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ date: string }> }) {
  const { date: rawDate } = await ctx.params;
  const date = rawDate.replace(/\.mp3$/i, "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date format, expected YYYY-MM-DD" }, { status: 400 });
  }
  const buf = await getEpisodeAudio(date);
  if (!buf) return NextResponse.json({ error: "episode not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
      "Accept-Ranges": "bytes",
      "Content-Length": String(buf.length),
    },
  });
}
