'use client';

import { useRef, useState } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

type Props = { storyId: number; text: string; voiceId?: string; compact?: boolean };

export function ListenButton({ storyId, text, voiceId, compact }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state === 'playing') {
      audioRef.current?.pause();
      setState('idle');
      return;
    }
    if (audioRef.current && state === 'idle' && audioRef.current.src) {
      audioRef.current.play();
      setState('playing');
      return;
    }
    setState('loading');
    try {
      const r = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, text, voiceId }),
      });
      if (!r.ok) throw new Error('tts failed');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      audioRef.current = a;
      a.onended = () => setState('idle');
      a.onpause = () => setState('idle');
      a.onplay = () => setState('playing');
      await a.play();
    } catch (err) {
      console.error(err);
      setState('idle');
    }
  }

  const Icon = state === 'loading' ? Loader2 : state === 'playing' ? Pause : Play;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`audio-btn ${state === 'playing' ? 'playing' : ''}`}
      aria-label="Listen to story"
    >
      <Icon size={11} className={state === 'loading' ? 'animate-spin' : ''} />
      <span>{compact ? '' : 'Listen'}</span>
    </button>
  );
}
