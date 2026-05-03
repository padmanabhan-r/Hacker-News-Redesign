import { DEFAULT_VOICES } from "./elevenlabs";

export type Persona =
  | "anchor" | "curious" | "skeptic" | "hype"
  | "veteran" | "hardware" | "indie" | "pragmatic";

export type CastMember = {
  persona: Persona;
  name: string;
  role: string;
  voiceId: string;
};

export const CAST: CastMember[] = [
  { persona: "anchor",   name: "Anchor Aiden",   role: "Host",            voiceId: DEFAULT_VOICES.anchor },
  { persona: "curious",  name: "Curious Maya",   role: "Co-host",         voiceId: DEFAULT_VOICES.curious },
  { persona: "skeptic",  name: "Skeptic Marcus", role: "Skeptic",         voiceId: DEFAULT_VOICES.skeptic },
  { persona: "hype",     name: "Hype Riley",     role: "Hype",            voiceId: DEFAULT_VOICES.hype },
  { persona: "veteran",  name: "Veteran Eli",    role: "Industry vet",    voiceId: DEFAULT_VOICES.veteran },
  { persona: "hardware", name: "Hardware Hana",  role: "Hardware expert", voiceId: DEFAULT_VOICES.hardware },
  { persona: "indie",    name: "Indie Sam",      role: "Indie hacker",    voiceId: DEFAULT_VOICES.indie },
  { persona: "pragmatic",name: "Pragmatic Pat",  role: "Narrator",        voiceId: DEFAULT_VOICES.pragmatic },
];

/** Stable hash-based voice assignment per HN author. */
export function pickVoice(author: string): CastMember {
  let h = 0;
  for (let i = 0; i < author.length; i++) h = ((h << 5) - h + author.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % CAST.length;
  return CAST[idx];
}

/** The two podcast hosts for narration / framing. */
export const HOSTS = {
  primary: CAST[0],   // Anchor Aiden
  secondary: CAST[1], // Curious Maya
};
