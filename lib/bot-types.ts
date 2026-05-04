export type BotState = "idle" | "listening" | "searching" | "speaking";

export type BotSourceMeta = {
  hnId?: number;
  score?: number;
  by?: string;
  comments?: number;
};

export type BotSource = {
  title: string;
  url: string;
  description?: string;
  meta?: BotSourceMeta;
};

export type BotTurn = {
  query: string;
  sources: BotSource[];
  label?: string;
};

const HN_ITEM_RE = /news\.ycombinator\.com\/item\?id=(\d+)/i;

function tryNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function parseSources(raw: string): BotSource[] {
  if (!raw) return [];
  return raw
    .split(";;")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split("|").map((p) => p.trim());
      const urlIdx = parts.findIndex((p) => /^https?:\/\//i.test(p));
      if (urlIdx === -1) return null;
      const title = parts.slice(0, urlIdx).join(" | ").trim() || parts[0] || "";
      const url = parts[urlIdx];
      const tail = parts.slice(urlIdx + 1);
      const description = tail[0] ?? "";
      const hnId = tryNumber(tail[1]) ?? (HN_ITEM_RE.exec(url)?.[1] ? Number(HN_ITEM_RE.exec(url)![1]) : undefined);
      const score = tryNumber(tail[2]);
      const by = tail[3] || undefined;
      const comments = tryNumber(tail[4]);
      const source: BotSource = {
        title,
        url,
        description: description || undefined,
        meta: hnId || score || by || comments ? { hnId, score, by, comments } : undefined,
      };
      return source;
    })
    .filter((s): s is BotSource => !!s && !!s.title && !!s.url);
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
