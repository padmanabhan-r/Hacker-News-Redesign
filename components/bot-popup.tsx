"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useBotConversation } from "@/hooks/use-bot-conversation";
import { BotOrb } from "@/components/bot/bot-orb";
import { CitationsRail } from "@/components/bot/citations-rail";
import { TranscriptLine } from "@/components/bot/transcript-line";
import type { BotState } from "@/lib/bot-types";

function StatusPill({ state }: { state: BotState }) {
  const label =
    state === "idle" ? "Idle" :
    state === "listening" ? "Listening" :
    state === "searching" ? "Searching" :
    "Speaking";
  return (
    <div className={`bot-pill bot-pill-${state}`}>
      <span className="bot-pill-dot" />
      {label}
    </div>
  );
}

function CloseIco() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function MicIco() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function StopIco() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}

type BotPopupProps = { open: boolean; onClose: () => void };

function BotBody({ ctl, onClose }: { ctl: ReturnType<typeof useBotConversation>; onClose: () => void }) {
  const conversation = useConversation();
  const [connecting, setConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<{ text: string; role: "user" | "agent" } | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (startedRef.current) {
        try { conversation.endSession(); } catch {}
        startedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    if (startedRef.current || connecting) return;
    setConnecting(true);
    ctl.setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = await fetch("/api/agent/signed-url");
      if (!r.ok) throw new Error("signed url failed");
      const { signedUrl } = (await r.json()) as { signedUrl: string };
      conversation.startSession({ signedUrl, connectionType: "websocket" });
      startedRef.current = true;
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      if (/permission|denied/i.test(m)) {
        ctl.setError("Microphone access denied. Allow mic and try again.");
      } else {
        ctl.setError("Couldn't start the bot. Try again in a moment.");
      }
    } finally {
      setConnecting(false);
    }
  };

  const stop = () => {
    if (!startedRef.current) return;
    try { conversation.endSession(); } catch {}
    startedRef.current = false;
  };

  // Message side-channel: keep a one-line transcript caption
  useEffect(() => {
    // useConversation exposes `message` (string | undefined) for last agent message
    if (conversation.message) {
      setLastMessage({ text: conversation.message, role: "agent" });
    }
  }, [conversation.message]);

  const live = startedRef.current;

  return (
    <div className="bot-shell">
      <header className="bot-head">
        <div className="bot-brand">
          <span className="bot-brand-dot" />
          <span className="bot-brand-name">HN++ Bot <span className="bot-beta">BETA</span></span>
          <span className="bot-brand-sub">live · powered by ElevenLabs</span>
        </div>
        <button type="button" onClick={onClose} className="bot-close" aria-label="Close">
          <CloseIco />
        </button>
      </header>

      <div className="bot-body">
        <section className="bot-stage">
          <StatusPill state={ctl.state} />
          <BotOrb state={ctl.state} size={210} />
          {ctl.state === "searching" && (
            <div className="bot-search-label">{ctl.searchLabel}</div>
          )}
          <div className="bot-transcript-wrap">
            {ctl.error ? (
              <div className="bot-error">{ctl.error}</div>
            ) : lastMessage ? (
              <TranscriptLine text={lastMessage.text} role={lastMessage.role} />
            ) : (
              <div className="bot-hint">
                {live ? "Ask anything about Hacker News" : "Tap start, then speak"}
              </div>
            )}
          </div>
          <div className="bot-actions">
            {!live ? (
              <button type="button" onClick={start} disabled={connecting} className="bot-btn bot-btn-primary">
                <MicIco />
                {connecting ? "Connecting…" : "Start"}
              </button>
            ) : (
              <button type="button" onClick={stop} className="bot-btn bot-btn-stop">
                <StopIco />
                End
              </button>
            )}
          </div>
        </section>
        <aside className="bot-aside">
          <CitationsRail turns={ctl.turns} />
        </aside>
      </div>

      <style>{`
        .bot-shell {
          display: flex; flex-direction: column;
          width: min(820px, 96vw);
          height: min(580px, 88vh);
          border-radius: 22px;
          background: var(--bg-card);
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          border: 1px solid var(--accent-border);
          box-shadow:
            0 32px 80px rgba(0,0,0,0.45),
            0 0 0 1px rgba(255,255,255,0.04) inset;
          overflow: hidden;
          animation: bot-pop 240ms cubic-bezier(0.2,0.8,0.2,1);
        }
        @keyframes bot-pop {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .bot-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
        }
        .bot-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .bot-brand-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent);
          animation: bot-pulse-dot 2s ease-in-out infinite;
        }
        @keyframes bot-pulse-dot {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .bot-brand-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 15px; letter-spacing: -0.3px;
          color: var(--text-1);
          display: inline-flex; align-items: center; gap: 7px;
        }
        .bot-beta {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8.5px; font-weight: 700; letter-spacing: 0.12em;
          padding: 2px 6px; border-radius: 4px;
          background: rgba(255,102,0,0.18);
          color: var(--accent);
          border: 1px solid rgba(255,102,0,0.40);
          line-height: 1;
        }
        .bot-brand-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--text-3);
        }
        .bot-close {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          color: var(--text-2);
          display: grid; place-items: center;
          cursor: pointer; transition: all 140ms ease;
        }
        .bot-close:hover { background: rgba(255,255,255,0.08); color: var(--text-1); }

        .bot-body {
          flex: 1;
          display: grid; grid-template-columns: 1.32fr 1fr;
          min-height: 0;
        }
        .bot-stage {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 18px; padding: 22px;
          border-right: 1px solid var(--border);
          position: relative;
        }
        .bot-aside { min-height: 0; min-width: 0; }

        .bot-pill {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
          padding: 5px 11px;
          border-radius: 999px;
          background: var(--accent-bg);
          color: var(--accent-text);
          border: 1px solid var(--accent-border);
          min-width: 110px; justify-content: center;
        }
        .bot-pill-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: currentColor;
          opacity: 0.85;
        }
        .bot-pill-listening .bot-pill-dot { animation: bot-pulse-dot 1.5s ease-in-out infinite; }
        .bot-pill-searching { background: rgba(255,200,140,0.14); }
        .bot-pill-searching .bot-pill-dot { animation: bot-pulse-dot 0.7s ease-in-out infinite; }
        .bot-pill-speaking .bot-pill-dot { animation: bot-pulse-dot 0.4s ease-in-out infinite; }

        .bot-search-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--accent-text);
          letter-spacing: 0.06em;
        }
        .bot-transcript-wrap {
          min-height: 56px;
          display: flex; align-items: center; justify-content: center;
        }
        .bot-hint {
          font-size: 12.5px; color: var(--text-3);
          letter-spacing: 0.02em;
        }
        .bot-error {
          font-size: 12.5px; line-height: 1.5; color: #ff8c8c;
          padding: 10px 14px; border-radius: 10px;
          background: rgba(255,80,80,0.08);
          border: 1px solid rgba(255,80,80,0.25);
          max-width: 360px; text-align: center;
        }

        .bot-actions { display: flex; gap: 10px; }
        .bot-btn {
          display: inline-flex; align-items: center; gap: 8px;
          height: 38px; padding: 0 18px; border-radius: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          border: 1px solid var(--border-med);
          cursor: pointer;
          transition: transform 120ms ease, background 160ms ease, border-color 160ms ease, opacity 160ms ease;
        }
        .bot-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .bot-btn-primary {
          background: var(--accent);
          color: #1a1208;
          border-color: var(--accent);
          box-shadow: 0 8px 28px -10px rgba(255,102,0,0.65);
        }
        .bot-btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
        .bot-btn-stop {
          background: rgba(255,255,255,0.04);
          color: var(--text-1);
        }
        .bot-btn-stop:hover { background: rgba(255,255,255,0.08); border-color: var(--border-strong); }

        @media (max-width: 760px) {
          .bot-shell { height: min(640px, 92vh); }
          .bot-body { grid-template-columns: 1fr; grid-template-rows: 1fr 220px; }
          .bot-stage { border-right: none; border-bottom: 1px solid var(--border); }
        }
      `}</style>
    </div>
  );
}

export function BotPopup({ open, onClose }: BotPopupProps) {
  const ctl = useBotConversation();

  const clientTools = useMemo(
    () => ({
      set_searching_state: (params: Record<string, unknown>) => {
        const label = typeof params?.label === "string" ? (params.label as string) : undefined;
        ctl.onSearching(label);
        return "ok";
      },
      show_sources: (params: Record<string, unknown>) => {
        const query = typeof params?.query === "string" ? (params.query as string) : "";
        const sources = typeof params?.sources === "string" ? (params.sources as string) : "";
        ctl.onShowSources(query, sources);
        return "ok";
      },
      open_story: (params: Record<string, unknown>) => {
        const id = Number(params?.storyId ?? params?.story_id);
        if (Number.isFinite(id)) {
          window.open(`https://news.ycombinator.com/item?id=${id}`, "_blank", "noopener");
        }
        return "ok";
      },
    }),
    [ctl],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) ctl.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="HN++ Bot"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="bot-overlay"
    >
      <ConversationProvider
        clientTools={clientTools}
        onModeChange={({ mode }) => ctl.onMode(mode)}
        onStatusChange={({ status }) => ctl.onStatus(status)}
        onError={(message) => ctl.setError(message || "Conversation error")}
      >
        <BotBody ctl={ctl} onClose={onClose} />
      </ConversationProvider>
      <style>{`
        @keyframes bot-fade { from { opacity: 0; } to { opacity: 1; } }
        .bot-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          z-index: 320;
          background: rgba(8,6,4,0.62);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: bot-fade 180ms ease-out;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
