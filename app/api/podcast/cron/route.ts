import { NextRequest, NextResponse } from "next/server";
import { getStoriesByFeed, getStoryThread, getTopStoriesByDate } from "@/lib/hn";
import { scrapeArticles } from "@/lib/firecrawl";
import { buildDialogueScript, type StoryInput } from "@/lib/dialogue-script";
import { renderDialogue } from "@/lib/dialogue-render";
import { castForDate } from "@/lib/podcast-cast";
import { putEpisode, putEpisodeScript, getEpisodeManifest, type DailyManifest } from "@/lib/podcast-store";

export const runtime = "nodejs";
export const maxDuration = 300;

const STORY_COUNT = 8;

function ptDateBucket(d = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

function ptDateLabel(d = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return fmt.format(d);
}

function labelFromYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function topComments(thread: { children?: Array<{ text?: string }> } | null, n = 5): string[] {
  if (!thread) return [];
  return (thread.children || [])
    .slice(0, n)
    .map((c) => stripHtml(c.text || ""))
    .filter((t) => t.length > 0);
}

function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${expected}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  if (q && q === expected) return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get("force") === "true";
  const date = req.nextUrl.searchParams.get("date") || ptDateBucket();
  const dateLabel = labelFromYmd(date);

  try {
    if (!force) {
      const existing = await getEpisodeManifest(date);
      if (existing) {
        return NextResponse.json({ ...existing, cached: true });
      }
    }

    const cast = castForDate(date);

    const today = ptDateBucket();
    const isHistorical = date !== today;
    const stories = isHistorical
      ? await getTopStoriesByDate(date, STORY_COUNT)
      : (await getStoriesByFeed("top", 1, STORY_COUNT)).items.slice(0, STORY_COUNT).filter((s) => s.title);

    if (stories.length === 0) {
      return NextResponse.json({ error: `no stories from HN for ${date}` }, { status: 502 });
    }

    const urls = stories.map((s) => s.url || "");
    const articles = await scrapeArticles(urls.filter(Boolean), { timeoutMs: 4500, concurrency: 5 });
    // Re-align articles with stories (Firecrawl skipped empties; we built from non-empty subset)
    const articleByUrl = new Map<string, typeof articles[number]>();
    let cursor = 0;
    for (const u of urls) {
      if (u) { articleByUrl.set(u, articles[cursor++]); }
    }

    const threads = await Promise.all(
      stories.map((s) => getStoryThread(s.id).catch(() => null)),
    );

    const dialogueInput: StoryInput[] = stories.map((s, i) => ({
      story: { id: s.id, title: s.title || "(untitled)", by: s.by, url: s.url, score: s.score, descendants: s.descendants },
      article: s.url ? articleByUrl.get(s.url) ?? null : null,
      comments: topComments(threads[i] as { children?: Array<{ text?: string }> } | null),
    }));

    const script = await buildDialogueScript({
      stories: dialogueInput,
      dateLabel,
      host: cast.host,
      guest: cast.guest,
    });

    // Persist the dialogue script before rendering so we can debug runs even if TTS fails
    await putEpisodeScript(date, {
      date,
      dateLabel,
      host: { name: cast.host.name, persona: cast.host.persona, voiceId: cast.host.voiceId },
      guest: { name: cast.guest.name, persona: cast.guest.persona, voiceId: cast.guest.voiceId },
      stories: dialogueInput.map((s) => ({ id: s.story.id, title: s.story.title, url: s.story.url })),
      script,
      generatedAt: new Date().toISOString(),
    });

    const rendered = await renderDialogue(script, {
      host: cast.host.voiceId,
      guest: cast.guest.voiceId,
    });

    const manifest: DailyManifest = {
      date,
      runtimeMs: rendered.runtimeMs,
      storyTitles: stories.map((s) => s.title || ""),
      host: { name: cast.host.name, persona: cast.host.persona, voiceId: cast.host.voiceId },
      guest: { name: cast.guest.name, persona: cast.guest.persona, voiceId: cast.guest.voiceId },
      segments: rendered.segmentTimings,
      generatedAt: new Date().toISOString(),
    };

    await putEpisode(date, rendered.mp3, manifest);

    return NextResponse.json({ ...manifest, cached: false });
  } catch (e) {
    console.error("[podcast/cron]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Convenience: GET also triggers if authorized (for browser-based dev triggers)
  return POST(req);
}
