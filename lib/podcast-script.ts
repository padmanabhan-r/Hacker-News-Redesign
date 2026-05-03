import type { AlgoliaStory, AlgoliaComment } from "./hn";
import { CAST, HOSTS, pickVoice, type CastMember } from "./voice-cast";

export type ScriptLine = {
  speaker: string;     // display name
  persona: string;     // persona/role label
  voiceId: string;
  text: string;        // text to synthesize (may include emotion tags for v3)
};

function flattenComments(c: AlgoliaComment[], maxDepth = 2, depth = 0): AlgoliaComment[] {
  const out: AlgoliaComment[] = [];
  for (const x of c) {
    if (x.text && x.author) out.push(x);
    if (depth < maxDepth && x.children?.length) out.push(...flattenComments(x.children, maxDepth, depth + 1));
  }
  return out;
}

function clean(s: string, max = 320): string {
  const t = s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

const EMOTIONS = ["[curious]", "[skeptical]", "[excited]", "[laughs]", "[thoughtful]", "[firm]"] as const;

function pickEmotion(i: number): string {
  return EMOTIONS[i % EMOTIONS.length];
}

/** Build a multi-voice dialogue script from a story + thread. */
export function buildScript(story: AlgoliaStory): ScriptLine[] {
  const top = flattenComments(story.children || [])
    .filter((c) => (c.points ?? 0) > 0)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 5);

  const lines: ScriptLine[] = [];
  const titleClean = clean(story.title, 200);
  const storyText = story.text ? clean(story.text, 240) : "";

  const commentCount = story.num_comments ?? (story.children?.length ?? 0);
  lines.push({
    speaker: HOSTS.primary.name,
    persona: HOSTS.primary.role,
    voiceId: HOSTS.primary.voiceId,
    text: `[upbeat] Welcome back to The HN Pod. Today's headline: "${titleClean}". Posted by ${story.author} with ${story.points} points and ${commentCount} comments.`,
  });

  lines.push({
    speaker: HOSTS.secondary.name,
    persona: HOSTS.secondary.role,
    voiceId: HOSTS.secondary.voiceId,
    text: `[curious] Interesting one. ${storyText ? "Here's what the author says: " + storyText : "Let's hear what the community thinks."}`,
  });

  if (top.length === 0) {
    lines.push({
      speaker: HOSTS.primary.name,
      persona: HOSTS.primary.role,
      voiceId: HOSTS.primary.voiceId,
      text: "[thoughtful] No top comments yet — but expect a lively discussion. We'll be back tomorrow with more.",
    });
    return lines;
  }

  top.forEach((c, i) => {
    const v = pickVoice(c.author);
    const emotion = pickEmotion(i);
    lines.push({
      speaker: c.author,
      persona: v.role,
      voiceId: v.voiceId,
      text: `${emotion} ${clean(c.text, 280)}`,
    });

    if (i === Math.floor(top.length / 2)) {
      lines.push({
        speaker: HOSTS.secondary.name,
        persona: HOSTS.secondary.role,
        voiceId: HOSTS.secondary.voiceId,
        text: "[reflective] That's a fair point — let's see how others responded.",
      });
    }
  });

  lines.push({
    speaker: HOSTS.primary.name,
    persona: HOSTS.primary.role,
    voiceId: HOSTS.primary.voiceId,
    text: `[warm] That wraps today's discussion. Tap the comments to read the full thread, or stay tuned for tomorrow's HN Pod.`,
  });

  return lines;
}

/** Unique cast members appearing in a script (for the host card grid). */
export function castFromScript(lines: ScriptLine[]): CastMember[] {
  const seen = new Set<string>();
  const out: CastMember[] = [];
  for (const l of lines) {
    const key = l.voiceId;
    if (seen.has(key)) continue;
    seen.add(key);
    const member = CAST.find((c) => c.voiceId === l.voiceId) ?? {
      persona: "guest",
      name: l.speaker,
      role: l.persona,
      voiceId: l.voiceId,
    };
    out.push(member);
  }
  return out;
}
