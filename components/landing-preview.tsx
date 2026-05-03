import { Headphones, Sparkles, Bot } from 'lucide-react';

const ROWS = [
  { score: 842, title: 'Show HN: I built a glassmorphic Hacker News reader with AI narration', domain: 'hn-plus-plus.vercel.app', meta: ['312 cmts', '2h ago', 'by you'], dur: '4:12', featured: true },
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
            <div className="pv-listen">▶ Listen</div>
          </div>
        ))}
      </div>

      {/* Floating chip 1 — podcast */}
      <div className="float-chip fc-podcast">
        <div className="fc-icon">
          <Headphones size={16} />
        </div>
        <div>
          <div className="fc-text-1">HN++ Pod</div>
          <div className="fc-text-2">VALLEY'S HOTTEST TALKS, DAILY</div>
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
          <div className="fc-text-1">Get the gist, skip the scroll</div>
          <div className="fc-text-2">AI AUDIO SUMMARY PER STORY</div>
        </div>
      </div>

      {/* Floating chip 3 — HN++ Bot */}
      <div className="float-chip fc-bot">
        <div className="fc-icon" style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
          <Bot size={16} />
        </div>
        <div>
          <div className="fc-text-1">HN++ Bot</div>
          <div className="fc-text-2">JUST ASK. NO SEARCHING.</div>
        </div>
      </div>
    </div>
  );
}
