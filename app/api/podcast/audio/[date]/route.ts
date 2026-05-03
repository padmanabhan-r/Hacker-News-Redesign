import { NextRequest, NextResponse } from "next/server";
import { r2PublicUrl } from "@/lib/r2-client";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ date: string }> }) {
  const { date: rawDate } = await ctx.params;
  const date = rawDate.replace(/\.mp3$/i, "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date format, expected YYYY-MM-DD" }, { status: 400 });
  }
  return NextResponse.redirect(r2PublicUrl(`podcast/${date}.mp3`), 302);
}
