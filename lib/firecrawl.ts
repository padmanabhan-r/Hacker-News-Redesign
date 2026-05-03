import { Firecrawl } from "@mendable/firecrawl-js";

let _client: Firecrawl | null = null;

function client() {
  if (!_client) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY missing in .env");
    _client = new Firecrawl({ apiKey });
  }
  return _client;
}

export type ScrapedArticle = {
  url: string;
  title?: string;
  description?: string;
  language?: string;
  markdown: string;
};

export async function scrapeArticle(url: string, timeoutMs = 4000): Promise<ScrapedArticle | null> {
  try {
    const doc = await client().scrape(url, {
      formats: ["markdown"],
      onlyMainContent: true,
      blockAds: true,
      removeBase64Images: true,
      fastMode: true,
      timeout: timeoutMs,
    });
    if (!doc?.markdown) return null;
    return {
      url,
      title: doc.metadata?.title,
      description: doc.metadata?.description,
      language: doc.metadata?.language,
      markdown: doc.markdown,
    };
  } catch (e) {
    console.warn(`[firecrawl] scrape failed for ${url}:`, (e as Error).message);
    return null;
  }
}

export async function scrapeArticles(
  urls: string[],
  { timeoutMs = 4000, concurrency = 5 }: { timeoutMs?: number; concurrency?: number } = {},
): Promise<Array<ScrapedArticle | null>> {
  const results: Array<ScrapedArticle | null> = new Array(urls.length).fill(null);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (cursor < urls.length) {
      const i = cursor++;
      results[i] = await scrapeArticle(urls[i], timeoutMs);
    }
  });
  await Promise.all(workers);
  return results;
}
