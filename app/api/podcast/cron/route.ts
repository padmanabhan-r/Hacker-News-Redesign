import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bakeEpisode } from "@/scripts/bake-episode";
import { istDateBucket } from "@/lib/date-bucket";

export const runtime = "nodejs";
export const maxDuration = 60;

const QuerySchema = z.object({
  force: z.enum(["true", "false"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  secret: z.string().optional(),
});

function authorized(req: NextRequest, querySecret: string | undefined): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${expected}`) return true;
  if (querySecret && querySecret === expected) return true;
  return false;
}

export async function POST(req: NextRequest) {
  const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid query", issues: parsed.error.issues }, { status: 400 });
  }
  if (!authorized(req, parsed.data.secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const force = parsed.data.force === "true";
  const date = parsed.data.date ?? istDateBucket();

  try {
    const result = await bakeEpisode(date, force);
    if (result.status === "no-stories") {
      return NextResponse.json({ error: `no stories from HN for ${date}` }, { status: 502 });
    }
    return NextResponse.json({
      ...result.manifest,
      cached: result.status === "cached",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
