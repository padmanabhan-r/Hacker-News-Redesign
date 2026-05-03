'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function LandingAmbient() {
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio('/audio/landing-loop.mp3');
    a.loop = true;
    a.volume = 0.18;
    a.muted = true;
    audioRef.current = a;
    a.play().catch(() => {});
    return () => { a.pause(); audioRef.current = null; };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    if (!a.muted) a.play().catch(() => {});
    setMuted(a.muted);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? 'Unmute ambient track' : 'Mute ambient track'}
      style={{
        position: 'fixed', right: 20, bottom: 20, zIndex: 100,
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-med)',
        backdropFilter: 'var(--blur)',
        WebkitBackdropFilter: 'var(--blur)',
        boxShadow: 'var(--shadow-md)',
        color: 'var(--text-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
}
