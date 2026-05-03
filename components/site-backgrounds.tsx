'use client';

import { useEffect, useRef } from 'react';

const CODE_LINES = [
  'GET /v0/topstories.json',
  '→ [37291023, 37291011, 37290992, ...]',
  '// fetch story 37291023',
  'GET /v0/item/37291023.json',
  '{ "by": "pg", "score": 842, "title": "Show HN: ..." }',
  '// summarize with Gemini',
  'POST /messages → 218 tokens',
  '// narrate with ElevenLabs',
  'POST /text-to-speech/voice_id → audio/mpeg',
  'cache.set(37291023, audioBlob)',
  'render(<StoryCard ... />)',
  '// done in 142ms',
  '',
  '// glass surface stack:',
  '.feed-card { backdrop-filter: blur(22px); }',
  '.panel { background: rgba(255,253,248,0.42); }',
  '',
  '// the firehose, with a voice.',
];

export function SiteBackgrounds() {
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = codeRef.current;
    if (!el) return;
    let out = '';
    for (let i = 0; i < 14; i++) {
      for (const l of CODE_LINES) out += l + '\n';
    }
    el.textContent = out;
  }, []);

  return (
    <>
      <div className="sf-bg" aria-hidden />
      <div className="sf-veil" aria-hidden />
      <div className="bg-grid" aria-hidden />
      <div className="bg-blob b1" aria-hidden />
      <div className="bg-blob b2" aria-hidden />
      <div className="bg-code" ref={codeRef} aria-hidden />
    </>
  );
}
