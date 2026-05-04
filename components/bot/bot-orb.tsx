"use client";

import type { BotState } from "@/lib/bot-types";

export function BotOrb({ state, size = 220 }: { state: BotState; size?: number }) {
  return (
    <div
      className={`bot-orb bot-orb-${state}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div className="bot-orb-glow" />
      <div className="bot-orb-ring" />
      <div className="bot-orb-ripple" />
      <div className="bot-orb-core">
        <svg width={size * 0.78} height={size * 0.78} viewBox="0 0 100 100">
          <defs>
            <radialGradient id="bot-orb-grad" cx="50%" cy="42%" r="60%">
              <stop offset="0%" stopColor="#ffd1a8" />
              <stop offset="35%" stopColor="#ff8c00" />
              <stop offset="78%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#9a3a00" />
            </radialGradient>
            <filter id="bot-orb-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="3" />
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.32 0" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="42" fill="url(#bot-orb-grad)" />
          <circle cx="50" cy="50" r="42" fill="url(#bot-orb-grad)" filter="url(#bot-orb-grain)" opacity="0.6" />
          <circle cx="36" cy="34" r="9" fill="#ffe9cc" opacity="0.55" />
        </svg>
      </div>
      <style>{`
        .bot-orb {
          position: relative;
          display: grid;
          place-items: center;
          isolation: isolate;
        }
        .bot-orb-core {
          position: relative;
          z-index: 2;
          display: grid; place-items: center;
          width: 78%; height: 78%;
          border-radius: 50%;
          transform-origin: center;
          transition: transform 240ms ease;
        }
        .bot-orb-glow {
          position: absolute; inset: 6%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, rgba(255,140,40,0.55) 0%, rgba(255,102,0,0.16) 45%, transparent 72%);
          filter: blur(26px);
          z-index: 0;
          opacity: 0.55;
          transition: opacity 320ms ease;
        }
        .bot-orb-ring {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1px dashed rgba(255,125,41,0.55);
          opacity: 0;
          transition: opacity 220ms ease;
          z-index: 1;
        }
        .bot-orb-ripple {
          position: absolute; inset: 8%;
          border-radius: 50%;
          border: 1px solid rgba(255,125,41,0.4);
          opacity: 0;
          z-index: 1;
        }

        .bot-orb-idle .bot-orb-core { animation: orb-breathe 8s ease-in-out infinite; }
        .bot-orb-idle .bot-orb-glow { opacity: 0.35; }

        .bot-orb-listening .bot-orb-core { animation: orb-pulse 3s ease-in-out infinite; }
        .bot-orb-listening .bot-orb-glow { opacity: 0.7; }
        .bot-orb-listening .bot-orb-ripple {
          opacity: 1;
          animation: orb-ripple 2.6s ease-out infinite;
        }

        .bot-orb-searching .bot-orb-core { filter: saturate(0.7) brightness(0.9); }
        .bot-orb-searching .bot-orb-ring {
          opacity: 1;
          animation: orb-spin 1.4s linear infinite;
        }
        .bot-orb-searching .bot-orb-glow { opacity: 0.45; }

        .bot-orb-speaking .bot-orb-core { animation: orb-speak 0.7s ease-in-out infinite; }
        .bot-orb-speaking .bot-orb-glow { opacity: 1; }

        @keyframes orb-breathe {
          0%, 100% { transform: scale(0.96); }
          50% { transform: scale(1.02); }
        }
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes orb-speak {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes orb-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orb-ripple {
          0% { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(1.25); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
