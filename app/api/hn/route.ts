import { NextRequest, NextResponse } from "next/server";
import { getStoriesByFeed, getStoriesSince, getRecentComments, getTopStoriesByDate, getStoryThread, searchHN, type FeedKind } from "@/lib/hn";

export const revalidate = 60;

const FEEDS: FeedKind[] = ["top", "new", "best", "ask", "show", "jobs", "past", "comments"];

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
      return NextResponse.json(story);
    }
    if (query) {
      const result = await searchHN(query);
      return NextResponse.json(result);
    }
    if (since) {
      const data = await getStoriesSince(parseInt(since, 10), pageSize);
      return NextResponse.json(data);
    }
    if (feed === "past") {
      const day = searchParams.get("day") || (() => {
        const d = new Date(Date.now() - 86400000);
        return d.toISOString().slice(0, 10);
      })();
      const items = await getTopStoriesByDate(day, pageSize);
      return NextResponse.json({ items, totalIds: items.length, hasMore: false, day });
    }
    if (feed === "comments") {
      const data = await getRecentComments(pageSize);
      return NextResponse.json(data);
    }
    if (!FEEDS.includes(feed)) {
      return NextResponse.json({ error: "invalid feed" }, { status: 400 });
    }
    const data = await getStoriesByFeed(feed, page, pageSize);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
