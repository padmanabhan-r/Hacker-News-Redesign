import { getStoriesByFeed, getStoryThread, getTopStoriesByDate } from "@/lib/hn";
import { scrapeArticles } from "@/lib/firecrawl";
import { buildDialogueScript, type StoryInput } from "@/lib/dialogue-script";
import { renderDialogue } from "@/lib/dialogue-render";
import { castForDate } from "@/lib/podcast-cast";
import { putEpisode, putEpisodeScript, getEpisodeManifest, type DailyManifest } from "@/lib/podcast-store";
import { istDateBucket, labelFromYmd } from "@/lib/date-bucket";

const STORY_COUNT = 8;

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

export type BakeResult =
  | { status: "cached"; manifest: DailyManifest }
  | { status: "baked"; manifest: DailyManifest }
  | { status: "no-stories"; date: string };

export async function bakeEpisode(date: string, force = false): Promise<BakeResult> {
  if (!force) {
    const existing = await getEpisodeManifest(date);
    if (existing) return { status: "cached", manifest: existing };
  }

  const dateLabel = labelFromYmd(date);
  const cast = castForDate(date);

  const today = istDateBucket();
  const isHistorical = date !== today;
  const stories = isHistorical
    ? await getTopStoriesByDate(date, STORY_COUNT)
    : (await getStoriesByFeed("top", 1, STORY_COUNT)).items.slice(0, STORY_COUNT).filter((s) => s.title);

  if (stories.length === 0) return { status: "no-stories", date };

  const urls = stories.map((s) => s.url || "");
  const articles = await scrapeArticles(urls.filter(Boolean), { timeoutMs: 4500, concurrency: 5 });
  const articleByUrl = new Map<string, typeof articles[number]>();
  let cursor = 0;
  for (const u of urls) {
    if (u) articleByUrl.set(u, articles[cursor++]);
  }

  const threads = await Promise.all(stories.map((s) => getStoryThread(s.id).catch(() => null)));

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
  return { status: "baked", manifest };
}

function parseArgs(argv: string[]): { date: string; force: boolean } {
  let date = istDateBucket();
  let force = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") force = true;
    else if (a === "--date") {
      const v = argv[++i];
      if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`invalid --date: ${v}`);
      date = v;
    }
  }
  return { date, force };
}

async function main() {
  await import("dotenv/config");
  const { date, force } = parseArgs(process.argv.slice(2));
  process.stdout.write(`[bake] date=${date} force=${force}\n`);
  const t0 = Date.now();
  const result = await bakeEpisode(date, force);
  const ms = Date.now() - t0;
  if (result.status === "cached") {
    process.stdout.write(`[bake] cached date=${date} (${ms}ms)\n`);
    return 0;
  }
  if (result.status === "no-stories") {
    process.stderr.write(`[bake] no-stories date=${date}\n`);
    return 2;
  }
  process.stdout.write(`[bake] baked date=${date} runtimeMs=${result.manifest.runtimeMs} (${ms}ms)\n`);
  return 0;
}

const isMain = (() => {
  try {
    const arg1 = process.argv[1] || "";
    return arg1.includes("bake-episode");
  } catch { return false; }
})();

if (isMain) {
  main().then((code) => process.exit(code)).catch((e) => {
    process.stderr.write(`[bake] error: ${(e as Error).stack || (e as Error).message}\n`);
    process.exit(1);
  });
}
