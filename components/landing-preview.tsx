import { Headphones, Sparkles } from 'lucide-react';

const ROWS = [
  { score: 842, title: 'Show HN: I built a glassmorphic Hacker News reader with AI narration', domain: 'hn-plus-plus.app', meta: ['312 cmts', '2h ago', 'by you'], dur: '4:12', featured: true },
  { score: 591, title: 'The unreasonable effectiveness of small models in production', domain: 'arxiv.org', meta: ['184 cmts', '4h ago'], dur: '6:48' },
  { score: 428, title: 'A retrospective on five years of running a side project to $1M ARR', domain: 'stripe.com/blog', meta: ['96 cmts', '5h ago'], dur: '11:02' },
  { score: 317, title: "Why we rewrote our build system in Rust (and you probably shouldn't)", domain: 'github.io', meta: ['240 cmts', '7h ago'], dur: '8:30' },
];

export function LandingPreview() {
  return (
    <div className="preview-stack">
      <div className="preview-card preview-main">
        <div className="pv-head">
          <div className="pv-brand">
            <div className="pv-mark" style={{ position: 'relative' }}>
              Y
              <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: 'white', color: 'var(--accent)', fontFamily: "'Syne', sans-serif", fontSize: '6px', fontWeight: 800, borderRadius: '3px', padding: '1px 2px', lineHeight: '1' }}>++</span>
            </div>
            <div className="pv-name">HN<span style={{ color: 'var(--accent)' }}>++</span></div>
          </div>
          <div className="pv-tabs">
            <div className="pv-tab active">Top</div>
            <div className="pv-tab">New</div>
            <div className="pv-tab">Best</div>
          </div>
        </div>
        <div className="pv-section-title">Top Stories</div>
        {ROWS.map((r, i) => (
          <div key={i} className={`pv-row ${r.featured ? 'featured' : ''}`}>
            <div className="pv-vote">
              <div className="pv-vote-arrow">▲</div>
              <div className="pv-score">{r.score}</div>
            </div>
            <div className="pv-body">
              <div className="pv-title">{r.title}</div>
              <div className="pv-domain">{r.domain}</div>
              <div className="pv-meta">{r.meta.map((m, j) => <span key={j}>{m}</span>)}</div>
            </div>
            <div className="pv-listen">▶ {r.dur}</div>
          </div>
        ))}
      </div>

      {/* Floating chip 1 — podcast */}
      <div className="float-chip fc-podcast">
        <div className="fc-icon">
          <Headphones size={16} />
        </div>
        <div>
          <div className="fc-text-1">Today's HN++ Pod</div>
          <div className="fc-text-2">8 STORIES · ~9 MIN</div>
        </div>
        <div className="fc-bars">
          <div className="fc-bar" />
          <div className="fc-bar" />
          <div className="fc-bar" />
          <div className="fc-bar" />
          <div className="fc-bar" />
        </div>
      </div>

      {/* Floating chip 2 — listen TL;DR */}
      <div className="float-chip fc-highlights">
        <div className="fc-icon violet">
          <Sparkles size={16} />
        </div>
        <div>
          <div className="fc-text-1">Listen · TL;DR audio</div>
          <div className="fc-text-2">UNDER 2 MIN PER STORY</div>
        </div>
      </div>
    </div>
  );
}
