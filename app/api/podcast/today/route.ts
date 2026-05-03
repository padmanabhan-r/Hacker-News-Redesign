import { NextResponse } from "next/server";
import { getEpisodeManifest, listRecent } from "@/lib/podcast-store";

export const runtime = "nodejs";

function ptDateBucket(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function GET() {
  const today = ptDateBucket();
  const m = await getEpisodeManifest(today);
  if (m) {
    return NextResponse.json({ ...m, stale: false });
  }
  const recent = await listRecent(7);
  if (recent.length > 0) {
    return NextResponse.json({ ...recent[0], stale: true, latestAvailable: recent[0].date });
  }
  return NextResponse.json({ error: "no episodes available yet" }, { status: 404 });
}
