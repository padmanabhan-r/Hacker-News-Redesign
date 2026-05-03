import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

let _client: ElevenLabsClient | null = null;

export function eleven() {
  if (!_client) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing in .env");
    _client = new ElevenLabsClient({ apiKey });
  }
  return _client;
}

export const TTS_MODEL = "eleven_multilingual_v2";
export const DIALOGUE_MODEL = "eleven_v3";
export const FLASH_MODEL = "eleven_flash_v2_5";
export const STT_MODEL = "scribe_v1";
export const OUTPUT_FORMAT = "mp3_44100_192" as const;

export const HOST_VOICE_SETTINGS = {
  stability: 0.45,
  similarityBoost: 0.85,
  style: 0.3,
  useSpeakerBoost: true,
};

export const DRAMATIC_VOICE_SETTINGS = {
  stability: 0.18,
  similarityBoost: 0.85,
  style: 0.55,
  useSpeakerBoost: true,
};

/** Default ElevenLabs preset voice IDs (free + scale plan). Override via voice-cast. */
export const DEFAULT_VOICES = {
  anchor:   "JBFqnCBsd6RMkjVDRZzb", // George — calm news anchor
  curious:  "EXAVITQu4vr4xnSDxMaL", // Sarah — warm, inquisitive
  skeptic:  "onwK4e9ZLuTAKqWW03F9", // Daniel — analytical, dry
  hype:     "XB0fDUnXU5powFXDhCwa", // Charlotte — high-energy
  veteran:  "iP95p4xoKVk53GoZ742B", // Chris — measured, gravelly
  hardware: "cgSgspJ2msm6clMCkdW9", // Jessica — precise
  indie:    "TX3LPaxmHKxFdv7VOQHJ", // Liam — laid-back
  pragmatic:"pNInz6obpgDQGcFmaJgB", // Adam — neutral baseline
} as const;
