'use client';

import Link from 'next/link';
import { Headphones, ArrowRight } from 'lucide-react';
import type { HNItem } from '@/lib/hn';
import { categorize } from '@/lib/hn';

export function TrendingSidebar({ items }: { items: HNItem[] }) {
  const totalScore = items.reduce((s, i) => s + (i.score || 0), 0);
  const totalComments = items.reduce((s, i) => s + (i.descendants || 0), 0);
  const aiCount = items.filter((i) => categorize(i.title).label === 'AI').length;
  const popular = [...items].sort((a, b) => (b.descendants || 0) - (a.descendants || 0)).slice(0, 6);

  return (
    <aside className="right-panel">
      {/* Podcast promo */}
      <Link href="/podcast" className="podcast-promo">
        <div className="pod-wave">
          {[40, 70, 90, 60, 80, 50, 65, 75].map((h, i) => (
            <div
              key={i}
              className="pod-bar"
              style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <div className="pod-title">Today's HN++ Pod</div>
        <div className="pod-sub">A multi-voice digest of the front page</div>
        <div className="pod-listen">
          <Headphones size={12} /> Listen now <ArrowRight size={11} />
        </div>
      </Link>

      {/* Stats */}
      <div className="panel-block">
        <div className="panel-head">
          <span className="p-dot-green" />
          <span className="panel-head-text">Live Snapshot</span>
        </div>
        <div>
          <Stat lbl="Stories" val={items.length.toString()} />
          <Stat lbl="Total points" val={totalScore.toLocaleString()} />
          <Stat lbl="Comments" val={totalComments.toLocaleString()} />
          <Stat lbl="AI stories" val={`${aiCount}/${items.length}`} />
        </div>
      </div>

      {/* Most discussed */}
      <div className="panel-block">
        <div className="panel-head">
          <span className="p-dot" />
          <span className="panel-head-text">Most Discussed</span>
        </div>
        <div>
          {popular.map((p, i) => (
            <Link
              key={p.id}
              href={`/feed?id=${p.id}`}
              className="trend-item"
            >
              <span className="trend-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="trend-label">{p.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Stat({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div className="stat-row">
      <span className="stat-lbl-2">{lbl}</span>
      <span className="stat-val-2">{val}</span>
    </div>
  );
}
