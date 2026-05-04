"use client";

export function TranscriptLine({ text, role }: { text: string; role: "user" | "agent" | "system" }) {
  if (!text) return null;
  return (
    <div className="bot-transcript">
      <span className={`bot-transcript-role role-${role}`}>{role === "user" ? "You" : role === "agent" ? "Bot" : "·"}</span>
      <span className="bot-transcript-text">{text}</span>
      <style>{`
        .bot-transcript {
          display: flex; gap: 10px;
          font-size: 12.5px; line-height: 1.5; color: var(--text-2);
          max-width: 360px; text-align: left;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg-card);
          backdrop-filter: blur(8px);
        }
        .bot-transcript-role {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--text-3);
          flex-shrink: 0;
          padding-top: 1px;
        }
        .role-user { color: var(--accent-text); }
        .bot-transcript-text {
          flex: 1;
          color: var(--text-1);
        }
      `}</style>
    </div>
  );
}
