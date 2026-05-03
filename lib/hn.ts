// HN API + categorization + thumbnails — TS port of hn-shared.js

const HN = "https://hacker-news.firebaseio.com/v0";
const ALGOLIA = "https://hn.algolia.com/api/v1";

export type FeedKind = "top" | "new" | "best" | "ask" | "show" | "jobs" | "past" | "comments";

const FEED_ENDPOINT: Partial<Record<FeedKind, string>> = {
  top: "topstories",
  new: "newstories",
  best: "beststories",
  ask: "askstories",
  show: "showstories",
  jobs: "jobstories",
};

export type HNItem = {
  id: number;
  by?: string;
  type?: "job" | "story" | "comment" | "poll" | "pollopt";
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  time?: number;
  descendants?: number;
  kids?: number[];
  parent?: number;
  dead?: boolean;
  deleted?: boolean;
};

export type AlgoliaComment = {
  id: number;
  author: string;
  text: string;
  created_at_i: number;
  points: number | null;
  parent_id: number;
  story_id: number;
  children: AlgoliaComment[];
};

export type AlgoliaStory = {
  id: number;
  title: string;
  url: string | null;
  author: string;
  points: number;
  created_at_i: number;
  num_comments: number;
  text?: string;
  children: AlgoliaComment[];
};

export async function getStoriesByFeed(
  feed: FeedKind = "top",
  page = 1,
  pageSize = 30
): Promise<{ items: HNItem[]; totalIds: number; hasMore: boolean }> {
  const endpoint = FEED_ENDPOINT[feed] || "topstories";
  const ids: number[] = await fetch(`${HN}/${endpoint}.json`, {
    next: { revalidate: 60 },
  }).then((r) => r.json());
  const start = (page - 1) * pageSize;
  const slice = ids.slice(start, start + pageSize);
  const items = await Promise.all(
    slice.map((id) =>
      fetch(`${HN}/item/${id}.json`, { next: { revalidate: 600 } })
        .then((r) => r.json() as Promise<HNItem>)
        .catch(() => null)
    )
  );
  return {
    items: items.filter((x): x is HNItem => !!x),
    totalIds: ids.length,
    hasMore: start + pageSize < ids.length,
  };
}

export async function getTopStories(n = 30): Promise<HNItem[]> {
  const { items } = await getStoriesByFeed("top", 1, n);
  return items;
}

/**
 * Historical "top stories of a day" — uses Algolia search filtered by created_at_i,
 * then ranks by points to approximate the day's front page.
 * Use this for back-baking podcast episodes for past dates.
 *
 * @param dateYmd YYYY-MM-DD (interpreted as a 24h UTC bucket; close enough for daily grouping)
 * @param n      number of top-ranked stories to return
 */
export async function getTopStoriesByDate(dateYmd: string, n = 30): Promise<HNItem[]> {
  const endMs = Date.parse(`${dateYmd}T00:00:00Z`);
  if (!Number.isFinite(endMs)) throw new Error(`invalid date ${dateYmd}`);
  const dayEnd = Math.floor(endMs / 1000) + 86400; // end of target day (midnight next day)
  const start = dayEnd - 3 * 86400;                // 3-day lookback window
  const url = `${ALGOLIA}/search?tags=story&numericFilters=created_at_i>=${start},created_at_i<${dayEnd}&hitsPerPage=200`;
  const r = await fetch(url, { next: { revalidate: 600 } }).then((res) => res.json());
  type Hit = { objectID: string; title?: string; url?: string | null; author?: string; points?: number; num_comments?: number; created_at_i?: number; story_text?: string | null };
  const hits = ((r?.hits ?? []) as Hit[]).filter((h) => h.title && (h.points ?? 0) >= 5);
  // Approximate HN gravity ranking: score / (age_hours + 2)^1.8, evaluated at end of day
  hits.sort((a, b) => {
    const ageA = (dayEnd - (a.created_at_i ?? dayEnd)) / 3600;
    const ageB = (dayEnd - (b.created_at_i ?? dayEnd)) / 3600;
    const rankA = ((a.points ?? 1) - 1) / Math.pow(ageA + 2, 1.8);
    const rankB = ((b.points ?? 1) - 1) / Math.pow(ageB + 2, 1.8);
    return rankB - rankA;
  });
  return hits.slice(0, n).map((h) => ({
    id: parseInt(h.objectID, 10),
    title: h.title,
    url: h.url ?? undefined,
    by: h.author,
    score: h.points ?? 0,
    descendants: h.num_comments ?? 0,
    time: h.created_at_i,
    text: h.story_text ?? undefined,
    type: "story" as const,
  }));
}

export async function getStoriesSince(
  since: number,
  pageSize = 30
): Promise<{ items: HNItem[]; totalIds: number; hasMore: boolean }> {
  const url = `${ALGOLIA}/search?tags=story&numericFilters=created_at_i>=${since}&hitsPerPage=${pageSize}`;
  const r = await fetch(url, { next: { revalidate: 120 } }).then((res) => res.json());
  const hits = ((r?.hits ?? []) as Array<{
    objectID: string; title?: string; url?: string | null; author?: string;
    points?: number; num_comments?: number; created_at_i?: number; story_text?: string | null;
  }>).filter((h) => h.title);
  hits.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const items = hits.map((h) => ({
    id: parseInt(h.objectID, 10),
    title: h.title,
    url: h.url ?? undefined,
    by: h.author,
    score: h.points ?? 0,
    descendants: h.num_comments ?? 0,
    time: h.created_at_i,
    text: h.story_text ?? undefined,
    type: "story" as const,
  }));
  return { items, totalIds: r?.nbHits ?? items.length, hasMore: false };
}

export async function getRecentComments(
  pageSize = 30
): Promise<{ items: HNItem[]; totalIds: number; hasMore: boolean }> {
  const url = `${ALGOLIA}/search_by_date?tags=comment&hitsPerPage=${pageSize}`;
  const r = await fetch(url, { next: { revalidate: 60 } }).then((res) => res.json());
  const hits = ((r?.hits ?? []) as Array<{
    objectID: string; author?: string; comment_text?: string;
    created_at_i?: number; parent_id?: number; story_id?: number;
    story_title?: string; story_url?: string;
  }>);
  const items: HNItem[] = hits.map((h) => ({
    id: parseInt(h.objectID, 10),
    by: h.author,
    text: h.comment_text ?? undefined,
    time: h.created_at_i,
    parent: h.parent_id,
    // story_id and story_title stored in url/title for rendering
    url: h.story_id ? `/feed?id=${h.story_id}` : undefined,
    title: h.story_title ?? undefined,
    type: "comment" as const,
  }));
  return { items, totalIds: r?.nbHits ?? items.length, hasMore: false };
}

export async function getStoryThread(id: number): Promise<AlgoliaStory> {
  return fetch(`${ALGOLIA}/items/${id}`, { next: { revalidate: 300 } }).then(
    (r) => r.json()
  );
}

export async function searchHN(query: string): Promise<{ hits: AlgoliaStory[] }> {
  const url = `${ALGOLIA}/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`;
  return fetch(url).then((r) => r.json());
}

/* ── Time ── */
export function timeAgo(ts?: number): string {
  if (!ts) return "";
  const d = Math.floor(Date.now() / 1000 - ts);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

/* ── Domain ── */
export function parseDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/* ── Categories ── */
export type Category = {
  label: string;
  color: string;
  bg: string;
  keys: string[];
};

export const CATEGORIES: Category[] = [
  { label: "AI",          color: "#a78bfa", bg: "rgba(167,139,250,0.12)", keys: ["ai","gpt","llm","model","openai","anthropic","gemini","claude","neural","machine learning","deep learning","copilot","mistral","chatgpt","artificial intelligence"] },
  { label: "Security",    color: "#f87171", bg: "rgba(248,113,113,0.10)", keys: ["hack","vulnerability","exploit","breach","attack","security","cve","malware","phish","zero-day","ransomware","encryption"] },
  { label: "Hardware",    color: "#34d399", bg: "rgba(52,211,153,0.10)",  keys: ["chip","cpu","gpu","arm","apple silicon","risc","fpga","hardware","semiconductor","nand","dram","ssd","m3","m4","transistor"] },
  { label: "Startups",    color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  keys: ["startup","funding","series","valuation","vc","venture","raise","unicorn","acquisition","ipo","founder"] },
  { label: "Engineering", color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  keys: ["rust","compiler","kernel","linux","open source","github","database","postgresql","distributed","protocol","framework","programming","developer"] },
  { label: "Science",     color: "#818cf8", bg: "rgba(129,140,248,0.10)", keys: ["research","paper","study","physics","biology","quantum","astronomy","climate","energy","genome","space","nasa"] },
  { label: "Web",         color: "#38bdf8", bg: "rgba(56,189,248,0.10)",  keys: ["browser","http","webassembly","wasm","javascript","typescript","css","html","react","next","svelte","bun","deno","web","frontend"] },
  { label: "Business",    color: "#fb923c", bg: "rgba(251,146,60,0.10)",  keys: ["google","amazon","apple","microsoft","meta","tesla","nvidia","market","revenue","profit","acquisition","ceo"] },
];

export const DEFAULT_CAT: Category = {
  label: "Tech",
  color: "#94a3b8",
  bg: "rgba(148,163,184,0.10)",
  keys: [],
};

export function categorize(title = ""): Category {
  const t = title.toLowerCase();
  for (const c of CATEGORIES) {
    if (c.keys.some((k) => t.includes(k))) return c;
  }
  return DEFAULT_CAT;
}

/* ── Gradient per category (for card bg) ── */
const CAT_GRADIENTS: Record<string, [string, string]> = {
  AI: ["#1e1040", "#0f0b2d"],
  Security: ["#2d0f0f", "#1a0808"],
  Hardware: ["#0a2218", "#051510"],
  Startups: ["#0a1628", "#050f1e"],
  Engineering: ["#1a1200", "#100d00"],
  Science: ["#111428", "#0b0d1e"],
  Web: ["#001828", "#001018"],
  Business: ["#1e0f08", "#120a04"],
  Tech: ["#0e1020", "#0a0c18"],
};

export function gradientForCat(cat: Category): string {
  const g = CAT_GRADIENTS[cat.label] || CAT_GRADIENTS.Tech;
  return `linear-gradient(135deg, ${g[0]} 0%, ${g[1]} 40%, #060810 100%)`;
}

export const CAT_EMOJI: Record<string, string> = {
  AI: "🤖", Security: "🔐", Hardware: "💾", Startups: "🚀",
  Engineering: "⚙️", Science: "🔬", Web: "🌐", Business: "📈", Tech: "💡",
};

/* ── Favicon helper ── */
export function getFavicon(url?: string | null, size = 64): string | null {
  const dom = parseDomain(url);
  if (!dom) return null;
  return `https://www.google.com/s2/favicons?domain=${dom}&sz=${size}`;
}

/* ── Microlink screenshot fallback ── */
export function getLinkPreview(story: HNItem): string | null {
  if (!story?.url) return null;
  return `https://api.microlink.io/?url=${encodeURIComponent(story.url)}&screenshot=true&meta=false&embed=screenshot.url`;
}
