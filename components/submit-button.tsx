'use client';

import { useEffect, useState } from 'react';

function PlusIco({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function XIco() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function SubmitButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="submit-btn" onClick={() => setOpen(true)}>
        <PlusIco size={11} /> Submit
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Submit a story"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(8,6,4,0.62)', backdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, animation: 'sb-fade 0.18s ease-out',
          }}
        >
          <div
            style={{
              width: 'min(440px, 100%)', borderRadius: 22,
              background: 'var(--bg-card)', border: '1px solid var(--accent-border)',
              padding: '32px 28px 26px', position: 'relative',
              boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                color: 'var(--text-3)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <XIco />
            </button>

            <div
              style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg, #ff8c00, #ff6600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', marginBottom: 14,
                boxShadow: '0 6px 18px rgba(255,102,0,0.40)',
              }}
            >
              <PlusIco size={28} />
            </div>

            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text-1)', marginBottom: 6 }}>
              Submit a story
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 99, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Not available in this preview build
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-2)', marginBottom: 18 }}>
              Story submissions aren't wired in this preview build. The interface and the audio pipelines
              are live.
            </div>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-3)',
              }}
            >
              Preview build · HN++ v0.1
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes sb-fade { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </>
  );
}
