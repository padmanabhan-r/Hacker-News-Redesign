'use client';

import { useState } from 'react';
import { BotPopup } from './bot-popup';

function RobotIco({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <line x1="12" y1="2" x2="12" y2="7" />
      <circle cx="12" cy="2" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.4" fill="currentColor" stroke="none" />
      <line x1="2" y1="13" x2="4" y2="13" />
      <line x1="20" y1="13" x2="22" y2="13" />
    </svg>
  );
}

export function TalkBotButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Talk to HN++ Bot"
        aria-label="Talk to HN++ Bot"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: 30, padding: '0 11px', borderRadius: 8,
          background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
          color: 'var(--accent-text)', cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
          letterSpacing: '0.04em', transition: 'all 0.13s',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,102,0,0.18)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-bg)'; }}
      >
        <RobotIco />
        <span>Talk to HN++ Bot</span>
      </button>

      <BotPopup open={open} onClose={() => setOpen(false)} />
    </>
  );
}
