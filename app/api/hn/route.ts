import { NextRequest, NextResponse } from "next/server";
import { getStoriesByFeed, getStoriesSince, getRecentComments, getTopStoriesByDate, getStoryThread, searchHN, type FeedKind } from "@/lib/hn";

export const revalidate = 60;

const FEEDS: FeedKind[] = ["top", "new", "best", "ask", "show", "jobs", "past", "comments"];

const CACHE_HEADER = "public, s-maxage=60, stale-while-revalidate=300";

function jsonWithCache(data: unknown, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", CACHE_HEADER);
  return res;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const feed = (searchParams.get("feed") || "top") as FeedKind;
  const id = searchParams.get("id");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "30", 10), 60);
  const since = searchParams.get("since");

  try {
    if (id) {
      const story = await getStoryThread(parseInt(id, 10));
      return jsonWithCache(story);
    }
    if (query) {
      const result = await searchHN(query);
      return jsonWithCache(result);
    }
    if (since) {
      const data = await getStoriesSince(parseInt(since, 10), pageSize);
      return jsonWithCache(data);
    }
    if (feed === "past") {
      const day = searchParams.get("day") || (() => {
        const d = new Date(Date.now() - 86400000);
        return d.toISOString().slice(0, 10);
      })();
      const items = await getTopStoriesByDate(day, pageSize);
      return jsonWithCache({ items, totalIds: items.length, hasMore: false, day });
    }
    if (feed === "comments") {
      const data = await getRecentComments(pageSize);
      return jsonWithCache(data);
    }
    if (!FEEDS.includes(feed)) {
      return NextResponse.json({ error: "invalid feed" }, { status: 400 });
    }
    const data = await getStoriesByFeed(feed, page, pageSize);
    return jsonWithCache(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
