import { NextResponse } from "next/server";
import { getEpisodeManifest, listRecent } from "@/lib/podcast-store";
import { istDateBucket } from "@/lib/date-bucket";

export const runtime = "nodejs";

export async function GET() {
  const today = istDateBucket();
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
