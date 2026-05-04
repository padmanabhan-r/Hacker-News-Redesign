"use client";

import { useEffect, useRef } from "react";
import type { BotTurn } from "@/lib/bot-types";
import { getDomain } from "@/lib/bot-types";

export function CitationsRail({ turns }: { turns: BotTurn[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  return (
    <div className="bot-rail">
      <div className="bot-rail-label">Citations</div>
      {turns.length === 0 ? (
        <div className="bot-rail-empty">
          Sources the bot cites will appear here as it answers.
        </div>
      ) : (
        turns.map((turn, ti) => (
          <div key={ti} className="bot-turn">
            {ti > 0 && <div className="bot-turn-sep" />}
            <div className="bot-turn-q">{turn.query || "Search"}</div>
            <div className="bot-turn-list">
              {turn.sources.map((s, i) => {
                const domain = getDomain(s.url);
                const isHN = !!s.meta?.hnId;
                return (
                  <a
                    key={`${s.url}-${i}`}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bot-source"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="bot-source-head">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                        alt=""
                        className="bot-source-fav"
                      />
                      <span className="bot-source-domain">{domain}</span>
                      {isHN && <span className="bot-source-tag">HN</span>}
                    </div>
                    <div className="bot-source-title">{s.title}</div>
                    {isHN && (s.meta?.score !== undefined || s.meta?.comments !== undefined) ? (
                      <div className="bot-source-meta">
                        {s.meta?.score !== undefined ? `${s.meta.score} pts` : ""}
                        {s.meta?.comments !== undefined ? ` · ${s.meta.comments} comments` : ""}
                        {s.meta?.by ? ` · by ${s.meta.by}` : ""}
                      </div>
                    ) : s.description ? (
                      <div className="bot-source-desc">{s.description}</div>
                    ) : null}
                  </a>
                );
              })}
            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
      <style>{`
        .bot-rail {
          height: 100%;
          overflow-y: auto;
          padding: 18px 16px 24px;
          display: flex; flex-direction: column;
        }
        .bot-rail-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--text-3); margin-bottom: 18px;
        }
        .bot-rail-empty {
          font-size: 12.5px; line-height: 1.55; color: var(--text-3);
          padding: 12px; border: 1px dashed var(--border-med); border-radius: 10px;
          background: rgba(255,255,255,0.02);
        }
        .bot-turn { animation: bot-turn-in 0.32s ease-out both; }
        .bot-turn-sep { height: 1px; background: var(--border); margin: 18px 0; }
        .bot-turn-q {
          font-family: 'Syne', sans-serif;
          font-size: 14.5px; font-weight: 700; letter-spacing: -0.2px;
          color: var(--accent-text); margin-bottom: 10px;
        }
        .bot-turn-list { display: flex; flex-direction: column; gap: 4px; }
        .bot-source {
          display: block;
          padding: 10px 12px;
          border: 1px solid transparent;
          border-radius: 10px;
          transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
          text-decoration: none;
          animation: bot-source-in 0.32s ease-out both;
        }
        .bot-source:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-med);
          transform: translateY(-1px);
        }
        .bot-source-head {
          display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
        }
        .bot-source-fav { width: 13px; height: 13px; opacity: 0.7; border-radius: 3px; }
        .bot-source-domain {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--text-3);
        }
        .bot-source-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 700; letter-spacing: 0.2em;
          padding: 2px 6px; border-radius: 999px;
          background: var(--accent-bg); color: var(--accent-text);
          border: 1px solid var(--accent-border);
        }
        .bot-source-title {
          font-size: 12.5px; line-height: 1.45; color: var(--text-1);
          margin-bottom: 4px;
        }
        .bot-source-meta {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px; color: var(--text-3); letter-spacing: 0.04em;
        }
        .bot-source-desc {
          font-size: 11.5px; line-height: 1.5; color: var(--text-3);
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes bot-turn-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bot-source-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
