import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { ScrapedArticle } from "./firecrawl";

let _client: GoogleGenAI | null = null;

function client() {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing in .env");
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

const MODEL = "gemini-flash-latest";

export type ListenInput = {
  story: { title: string; by?: string; url?: string; score?: number; descendants?: number };
  article: ScrapedArticle | null;
  comments: string[];
};

export type RadioStoryInput = {
  story: { id: number; title: string; by?: string; url?: string; score?: number; descendants?: number };
  article: ScrapedArticle | null;
  comments: string[];
};

function clampMarkdown(md: string | undefined, maxChars: number): string {
  if (!md) return "";
  const trimmed = md.trim();
  return trimmed.length > maxChars ? trimmed.slice(0, maxChars) + "…" : trimmed;
}

function buildListenPrompt({ story, article, comments }: ListenInput): string {
  const articleText = article
    ? `# ${article.title || story.title}\n\n${clampMarkdown(article.markdown, 9000)}`
    : `(article body unavailable — work from title + comments)\nTitle: ${story.title}`;
  const commentBlock = comments.length
    ? comments.map((c, i) => `(${i + 1}) ${clampMarkdown(c, 600)}`).join("\n")
    : "(no comments yet)";
  return `You are a warm audiobook narrator. Speak in clean, flowing prose meant to be heard, not read.

Article (scraped from ${story.url || "the linked page"}):
${articleText}

Top Hacker News comments (sentiment + key reactions):
${commentBlock}

Task: produce 180-220 spoken words that:
- Open with a one-sentence hook about the article.
- Explain the core idea in two or three plain sentences (no jargon dumps).
- Convey what the HN crowd is feeling — agreement, pushback, surprise, jokes.
- Close with a brief takeaway.

Hard rules: no headings, no bullet points, no markdown, no stage directions, no "in this article", no "Welcome listeners". Just narration. Output only the spoken text.`;
}

function buildRadioPrompt(stories: RadioStoryInput[]): string {
  const blocks = stories.map((s, idx) => {
    const articleText = s.article ? clampMarkdown(s.article.markdown, 4500) : "(scrape unavailable)";
    const commentBlock = s.comments.length
      ? s.comments.slice(0, 5).map((c, i) => `   (${i + 1}) ${clampMarkdown(c, 400)}`).join("\n")
      : "   (no comments yet)";
    return `### Story ${idx + 1}: ${s.story.title}
- url: ${s.story.url || "(self post)"} | by: ${s.story.by || "?"} | score: ${s.story.score ?? 0} | comments: ${s.story.descendants ?? 0}
- article excerpt:
${articleText}
- top comments:
${commentBlock}`;
  }).join("\n\n");

  return `You are the host of a daily Hacker News radio show — "HN++ Daily". Warm, curious, informed, never robotic. Imagine a smart friend reading the news to you on a slow afternoon walk.

Today's top ${stories.length} stories:

${blocks}

Write a spoken monologue, ~1700-1900 words, structured as one continuous radio segment:

- 30-second cold open: tease two or three story themes, set the vibe of the day.
- For each story, in order, deliver: a one-line lead, ~80-110 words explaining what's going on, what the comments think, and any surprising angle. Use natural transitions like "next up", "shifting gears", "now here's a weird one".
- A 30-second sign-off that tees up tomorrow.

Hard rules: no headings, no bullet points, no markdown, no stage directions, no music cues, no "[INTRO MUSIC]". Just continuous narration meant to be read aloud. Output only the script.`;
}

export async function* summarizeForListenStream(input: ListenInput): AsyncIterable<string> {
  const stream = await client().models.generateContentStream({
    model: MODEL,
    config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
    contents: [{ role: "user", parts: [{ text: buildListenPrompt(input) }] }],
  });
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

export async function summarizeForListen(input: ListenInput): Promise<string> {
  let out = "";
  for await (const chunk of summarizeForListenStream(input)) out += chunk;
  return out.trim();
}

export async function buildRadioScript(stories: RadioStoryInput[]): Promise<string> {
  const stream = await client().models.generateContentStream({
    model: MODEL,
    config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } },
    contents: [{ role: "user", parts: [{ text: buildRadioPrompt(stories) }] }],
  });
  let out = "";
  for await (const chunk of stream) if (chunk.text) out += chunk.text;
  return out.trim();
}
