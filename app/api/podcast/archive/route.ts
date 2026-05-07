import { NextResponse } from "next/server";
import { listRecent } from "@/lib/podcast-store";

export const runtime = "nodejs";

export async function GET() {
  const episodes = await listRecent(14);
  return NextResponse.json({ episodes });
}
