import { NextRequest, NextResponse } from "next/server";
import { getStoriesByFeed, getStoryThread, searchHN, type FeedKind } from "@/lib/hn";

export const revalidate = 60;

const FEEDS: FeedKind[] = ["top", "new", "best", "ask", "show", "jobs"];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const feed = (searchParams.get("feed") || "top") as FeedKind;
  const id = searchParams.get("id");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "30", 10), 60);

  try {
    if (id) {
      const story = await getStoryThread(parseInt(id, 10));
      return NextResponse.json(story);
    }
    if (query) {
      const result = await searchHN(query);
      return NextResponse.json(result);
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
