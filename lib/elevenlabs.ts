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
export const STT_MODEL = "scribe_v2";
export const STT_LANGUAGE = "en";
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

export const NARRATOR_VOICE_SETTINGS = {
  stability: 0.22,
  similarityBoost: 0.90,
  style: 0.45,
  useSpeakerBoost: true,
  speed: 0.85,
};

export const NARRATION_OUTPUT_FORMAT = "mp3_44100_128" as const;

export type NarrationOpts = {
  voiceId?: string;
  previousText?: string;
  nextText?: string;
  modelId?: string;
};

export async function streamNarration(text: string, opts: NarrationOpts = {}) {
  const voice = opts.voiceId || DEFAULT_VOICES.anchor;
  const model = opts.modelId || FLASH_MODEL;
  const stream = await eleven().textToSpeech.stream(voice, {
    text,
    modelId: model,
    outputFormat: NARRATION_OUTPUT_FORMAT,
    optimizeStreamingLatency: 4,
    voiceSettings: NARRATOR_VOICE_SETTINGS,
    previousText: opts.previousText,
    nextText: opts.nextText,
  });
  return stream as unknown as AsyncIterable<Uint8Array>;
}

export async function narrationToBuffer(text: string, opts: NarrationOpts = {}): Promise<Buffer> {
  const stream = await streamNarration(text, opts);
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/** Default ElevenLabs preset voice IDs (free + scale plan). Override via voice-cast. */
export const DEFAULT_VOICES = {
  anchor:   "6u6JbqKdaQy89ENzLSju", // Brielle — warm female host
  curious:  "EXAVITQu4vr4xnSDxMaL", // Sarah — warm, inquisitive
  skeptic:  "onwK4e9ZLuTAKqWW03F9", // Daniel — analytical, dry
  hype:     "XB0fDUnXU5powFXDhCwa", // Charlotte — high-energy
  veteran:  "iP95p4xoKVk53GoZ742B", // Chris — measured, gravelly
  hardware: "cgSgspJ2msm6clMCkdW9", // Jessica — precise
  indie:    "TX3LPaxmHKxFdv7VOQHJ", // Liam — laid-back
  pragmatic:"pNInz6obpgDQGcFmaJgB", // Adam — neutral baseline
} as const;
