import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import type { ScrapedArticle } from "./firecrawl";
import type { CastMember } from "./voice-cast";

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

export type DialogueSpeaker = "A" | "B";
export type DialogueLine = { speaker: DialogueSpeaker; emotion?: string; text: string };
export type DialogueScript = {
  intro: DialogueLine[];
  segments: { title: string; lines: DialogueLine[] }[];
  outro: DialogueLine[];
};

export type StoryInput = {
  story: { id: number; title: string; by?: string; url?: string; score?: number; descendants?: number };
  article: ScrapedArticle | null;
  comments: string[];
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: ["intro", "segments", "outro"],
  properties: {
    intro: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["speaker", "text"],
        properties: {
          speaker: { type: Type.STRING, enum: ["A", "B"] },
          emotion: { type: Type.STRING },
          text: { type: Type.STRING },
        },
      },
    },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["title", "lines"],
        properties: {
          title: { type: Type.STRING },
          lines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["speaker", "text"],
              properties: {
                speaker: { type: Type.STRING, enum: ["A", "B"] },
                emotion: { type: Type.STRING },
                text: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
    outro: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["speaker", "text"],
        properties: {
          speaker: { type: Type.STRING, enum: ["A", "B"] },
          emotion: { type: Type.STRING },
          text: { type: Type.STRING },
        },
      },
    },
  },
} as const;

function clamp(s: string | undefined, n: number): string {
  if (!s) return "";
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function buildPrompt(input: {
  stories: StoryInput[];
  dateLabel: string;
  host: CastMember;
  guest: CastMember;
}): string {
  const { stories, dateLabel, host, guest } = input;

  const storyBlocks = stories.map((s, i) => {
    const article = s.article ? clamp(s.article.markdown, 3500) : "(scrape unavailable — work from title + comments)";
    const commentBlock = s.comments.length
      ? s.comments.slice(0, 5).map((c, idx) => `   (${idx + 1}) ${clamp(c, 350)}`).join("\n")
      : "   (no top comments yet)";
    return `### Story ${i + 1}: ${s.story.title}
- source: ${s.story.url || "(self post)"}
- score: ${s.story.score ?? 0}, comments: ${s.story.descendants ?? 0}
- article excerpt:
${article}
- top comment vibes (anonymous — DO NOT name commenters):
${commentBlock}`;
  }).join("\n\n");

  return `You are writing the daily HN++ Pod, a smart, expressive Hacker News morning show.

Today is ${dateLabel}.

Two voices:
- Speaker A: HOST. Name "${host.name.replace(/^Anchor /, "")}" (call her "${host.name.split(" ").pop()}"). Role: ${host.role}. Warm, sharp morning-radio host. Knowledgeable, threads the segments together, keeps the pace tight.
- Speaker B: GUEST. Name "${guest.name}". Role: ${guest.role} (a ${guest.persona} perspective). Brings ${guest.persona === "skeptic" ? "pushback and reality checks" : guest.persona === "hype" ? "enthusiasm and big-picture excitement" : guest.persona === "veteran" ? "industry history and pattern recognition" : guest.persona === "hardware" ? "low-level / silicon / systems intuition" : guest.persona === "indie" ? "scrappy founder / hacker perspective" : guest.persona === "pragmatic" ? "level-headed engineering tradeoffs" : "curious, asking smart follow-ups"}.

Today's stories (we cover all ${stories.length}, in this order):

${storyBlocks}

Write the script as JSON matching the provided schema. Hard rules — these are tight on purpose, do NOT exceed them:

1. **TOTAL SPOKEN LENGTH: 700–900 words.** Count words across intro + every segment + outro. This targets ~5 minutes at our voice rate. Stay tight — every word must earn its place.
2. **Word budget per section** (use as a scaffold; do not exceed the upper bound):
   - Intro: 50–70 words.
   - Each story segment: 70–90 words. Eight stories × ~80 ≈ 640.
   - Outro: 30–50 words.
3. **Cold open** ("intro"): exactly **3–4 lines**. Speaker A starts with literally "Welcome to HN++ Pod" and the date, then introduces Speaker B by name + role. One tease line naming the biggest theme from today's stories. ≤1 emotion tag in the intro.
4. **Per-story segments**: one entry per story, in order. "title" = the story title (verbatim). "lines" = exactly **4–5 turns** (alternating A/B mostly). Each line is one sentence — two maximum. Host opens with the sharpest signal from the story; guest reacts in their persona; one exchange on what the community is saying. No filler ("yeah totally", "right", "interesting"). No meta transitions ("let's move on") — go straight to the next segment.
5. **Outro**: exactly **2–3 lines**. Quick sign off. Mention "HN++ Pod, back tomorrow at 7 AM Pacific". 30–50 words.
6. Use emotion tags via the "emotion" field (string like "curious", "laughs", "thoughtful", "excited", "skeptical", "warm", "chuckles", "sigh"). Use them sparingly — at most ~1 in 5 lines. Do NOT put them inside the "text" field.
7. NEVER include stage directions, music cues, sponsor reads, or markdown in "text". Just spoken sentences.
8. NEVER speak the words "Speaker A" / "Speaker B". Refer to each other by name.
9. Avoid robotic phrasing. Contractions, asides — but stay tight on word count. Cut every word that doesn't pull weight.
10. **NEVER name a Hacker News user or submitter.** Do not say "user X said", "bazlightyear pointed out", "the OP", "the submitter", "the author posted", "the thread", "in the thread", "the HN thread". Treat every comment as anonymous community sentiment. Phrase reactions as: "the community largely agrees…", "one camp argued…", "folks pushed back saying…", "the conversation lit up about…", "there's a sharp counter that…", "a few skeptics noted…", "engineers online pushed back…", "people are split on…".
11. **Tell it as news, not as commentary on a post.** Do NOT say "the post says", "the article says", "the write-up explains", "according to the piece", "the blog reports". Just deliver the substance directly the way a news anchor would. ("Kimi K2.6 just topped a coding benchmark…" — not "The post says Kimi K2.6 topped a coding benchmark…"). The article is the SOURCE you're working from, not a thing the script should keep referring to. If you must attribute, name the actual entity (the company, the lab, the maintainer) — never the abstract "post" or "article" wrapper.

Output ONLY the JSON. No surrounding prose.`;
}

export async function buildDialogueScript(input: {
  stories: StoryInput[];
  dateLabel: string;
  host: CastMember;
  guest: CastMember;
}): Promise<DialogueScript> {
  const prompt = buildPrompt(input);

  async function attempt(): Promise<DialogueScript> {
    const result = await client().models.generateContent({
      model: MODEL,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
        temperature: 0.85,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.text;
    if (!text) throw new Error("empty response");
    const parsed = JSON.parse(text) as DialogueScript;
    if (!parsed?.intro || !parsed?.segments || !parsed?.outro) throw new Error("schema mismatch");
    return parsed;
  }

  try { return await attempt(); }
  catch (e) {
    console.warn("[dialogue-script] first attempt failed:", (e as Error).message, "— retrying");
    return await attempt();
  }
}
