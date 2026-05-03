import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStoryThread } from "@/lib/hn";
import { scrapeArticle } from "@/lib/firecrawl";
import { summarizeForListen } from "@/lib/gemini";
import { narrationToBuffer, FLASH_MODEL } from "@/lib/elevenlabs";
import { hashKey, readCache, writeCache, readJsonCache, writeJsonCache } from "@/lib/render-cache";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ storyId: z.number().int().positive(), voiceId: z.string().optional() });

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function topComments(thread: { children: { text: string; children: { text: string }[] }[] }, n = 5): string[] {
  return (thread.children || [])
    .slice(0, n)
    .map((c) => stripHtml(c.text || ""))
    .filter((t) => t.length > 0);
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const { storyId, voiceId } = parsed.data;

  try {
    const story = await getStoryThread(storyId);
    if (!story?.title) return NextResponse.json({ error: "story not found" }, { status: 404 });
    const article = story.url ? await scrapeArticle(story.url, 4000).catch(() => null) : null;
    const comments = topComments(story as { children: { text: string; children: { text: string }[] }[] });

    const articleSig = article?.markdown ? article.markdown.slice(0, 240) : "noscrape";
    const cacheKey = hashKey(["listen", storyId, FLASH_MODEL, voiceId || "anchor", articleSig]);

    const cachedAudio = await readCache(cacheKey);
    if (cachedAudio) {
      return new NextResponse(new Uint8Array(cachedAudio), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
          "X-HNPP-Cache": "hit",
        },
      });
    }

    const summary = await summarizeForListen({
      story: {
        title: story.title,
        by: story.author,
        url: story.url ?? undefined,
        score: story.points,
        descendants: story.num_comments,
      },
      article,
      comments,
    });

    if (!summary) {
      return NextResponse.json({ error: "empty summary" }, { status: 502 });
    }

    const audio = await narrationToBuffer(summary, { voiceId });
    await writeCache(cacheKey, audio);
    await writeJsonCache(cacheKey, { summary, scraped: !!article, commentCount: comments.length });

    return new NextResponse(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "X-HNPP-Cache": "miss",
        "X-HNPP-Scraped": article ? "1" : "0",
      },
    });
  } catch (e) {
    console.error("[listen]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// debug helper: GET returns the cached summary text for a given key, useful during dev
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  const meta = await readJsonCache<{ summary: string; scraped: boolean; commentCount: number }>(key);
  if (!meta) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(meta);
}
