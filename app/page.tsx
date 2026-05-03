import Link from 'next/link';
import { ArrowRight, Headphones, Sparkles, Clock, MessageSquareText, Globe2, Sun } from 'lucide-react';
import { SiteBackgrounds } from '@/components/site-backgrounds';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { LandingPreview } from '@/components/landing-preview';
import { LandingAmbient } from '@/components/landing-ambient';

export default function Landing() {
  return (
    <>
      <SiteBackgrounds />
      <LandingAmbient />

      <div className="page">
        {/* Top nav */}
        <nav className="topnav glass" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 20px', borderRadius: 14, marginBottom: 48,
        }}>
          <Brand />
          <div className="flex items-center gap-1.5">
            <a href="#features" className="topnav-link">Features</a>
            <a href="#built" className="topnav-link">Built with</a>
            <ThemeToggle />
            <Link href="/highlights" className="topnav-cta ml-1">
              Try HN++ now
              <ArrowRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-left">
            <div className="kicker mb-[22px]">
              <span className="kicker-dot" />
              Built for ElevenHacks · with v0
            </div>
            <h1 className="hero-title">
              Hacker News,<br />
              now with a <span className="plus">voice</span>.
            </h1>
            <p className="hero-subtitle">
              <strong>HN++</strong> is a calm, glassmorphic redesign of Hacker News with AI-narrated stories,
              daily highlights, and a podcast feed. Same community. Same firehose.
              Now you can <strong>listen</strong> on your commute.
            </p>
            <div className="hero-cta-row">
              <Link href="/highlights" className="btn-primary">
                Try HN++ now
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
              <Link href="/podcast" className="btn-secondary">
                <Headphones size={14} />
                Listen to today's HN++ pod
              </Link>
            </div>
            <div className="built-strip">
              <span>BUILT WITH</span>
              <div className="built-divider" />
              <div className="built-logos">
                <div className="logo-pill">
                  <svg width="13" height="13" viewBox="0 0 256 256" fill="none"><rect width="256" height="256" rx="40" fill="#000" /><path d="M70 60h32l30 88 30-88h32l-46 136h-32z" fill="#fff" /></svg>
                  v0
                </div>
                <div className="logo-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#000" /><path d="M9.5 8v8M14.5 8v8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
                  ElevenLabs
                </div>
                <div className="logo-pill">
                  <span className="yc-y">Y</span>
                  HN API
                </div>
                <div className="logo-pill">
                  <img src="/firecrawl-logo.svg" width="10" height="10" alt="Firecrawl" style={{ objectFit: 'contain' }} />
                  Firecrawl
                </div>
                <div className="logo-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <defs><linearGradient id="gp" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#4285F4"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient></defs>
                    <path d="M12 2L13.8 10.2L22 12L13.8 13.8L12 22L10.2 13.8L2 12L10.2 10.2L12 2Z" fill="url(#gp)"/>
                  </svg>
                  Gemini
                </div>
                <div className="logo-pill">
                  <svg width="16" height="10" viewBox="361 0 342 155" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M674.9 91.8L632 67.2l-7.4-3.2-175.5 1.2v89.1h225.8z" fill="#fff"/>
                    <path fill="#F38020" d="M596.8 146c2.1-7.2 1.3-13.8-2.2-18.7-3.2-4.5-8.6-7.1-15.1-7.4l-123.1-1.6c-.8 0-1.5-.4-1.9-1-.4-.6-.5-1.4-.3-2.2.4-1.2 1.6-2.1 2.9-2.2l124.2-1.6c14.7-.7 30.7-12.6 36.3-27.2l7.1-18.5c.3-.8.4-1.6.2-2.4C616.9 27 584.6 0 546 0c-35.6 0-65.8 23-76.6 54.9-7-5.2-15.9-8-25.5-7.1-17.1 1.7-30.8 15.4-32.5 32.5-.4 4.4-.1 8.7.9 12.7-27.9.8-50.2 23.6-50.2 51.7 0 2.5.2 5 .5 7.5.2 1.2 1.2 2.1 2.4 2.1h227.2c1.3 0 2.5-.9 2.9-2.2z"/>
                    <path fill="#FAAE40" d="M636 67.1c-1.1 0-2.3 0-3.4.1-.8 0-1.5.6-1.8 1.4L626 85.3c-2.1 7.2-1.3 13.8 2.2 18.7 3.2 4.5 8.6 7.1 15.1 7.4l26.2 1.6c.8 0 1.5.4 1.9 1 .4.6.5 1.5.3 2.2-.4 1.2-1.6 2.1-2.9 2.2l-27.3 1.6c-14.8.7-30.7 12.6-36.3 27.2l-2 5.1c-.4 1 .3 2 1.4 2h93.8c1.1 0 2.1-.7 2.4-1.8 1.6-5.8 2.5-11.9 2.5-18.2 0-37-30.2-67.2-67.3-67.2"/>
                  </svg>
                  Cloudflare
                </div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <LandingPreview />
          </div>
        </section>

        {/* Features */}
        <section className="section" id="features">
          <h2 className="section-title">Same firehose. New senses.</h2>
          <p className="section-sub">
            HN++ keeps everything you love about Hacker News — the rankings, the threads, the discoveries —
            and adds a calmer surface plus a few thoughtful AI features that respect your time.
          </p>

          <div className="features-grid">
            <Feature tag="01 / VOICE" title="Listen — TL;DR audio" icon={<Headphones size={20} />}>
              Tap the play icon on any story. Under two minutes, ElevenLabs reads you a tight TL;DR — what
              the article says, plus what the comments crowd is feeling.
            </Feature>
            <Feature tag="02 / DIGEST" title="Smart article scraping" icon={<Sparkles size={20} />} violet>
              Firecrawl reads the linked page, Gemini writes the script, ElevenLabs voices it. You get the
              substance — not the SEO filler, not the comment scrollback.
            </Feature>
            <Feature tag="03 / PODCAST" title="The HN Pod" icon={<Clock size={20} />}>
              A daily 8–10 min HN++ Pod — a host and a rotating guest dig into the day's top stories
              and best comments, with chapter markers. Ready every morning at 7 AM PT.
            </Feature>
            <Feature tag="04 / THREADS" title="Smarter comment threads" icon={<MessageSquareText size={20} />}>
              Collapsible, color-coded by depth, with a "best replies" filter. Same content. Less work to read.
            </Feature>
            <Feature tag="05 / API" title="Real HN data" icon={<Globe2 size={20} />}>
              Streams live from the official Firebase API — same stories, same scores, same comments.
              We just present them differently.
            </Feature>
            <Feature tag="06 / FEEL" title="Glass & warm light" icon={<Sun size={20} />}>
              A warm, late-afternoon SF palette with frosted glass surfaces. Dense enough for power users,
              calm enough for leisurely reading.
            </Feature>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-strip">
          <Stat n="6" lbl="HN feed categories" />
          <Stat n="3" lbl="AI-powered features" />
          <Stat n="0" lbl="Ads or trackers" />
          <Stat n="Live" lbl="HN data · Firebase API" />
        </section>

        {/* CTA */}
        <section className="cta-card" id="built">
          <div>
            <div className="kicker" style={{ marginBottom: 18 }}>
              <span className="kicker-dot" />
              ElevenHacks Submission
            </div>
            <h2 className="cta-title">Built for a Hackathon.<br />Designed to last longer.</h2>
            <p className="cta-desc">
              HN++ was prototyped during ElevenHacks using v0 for the React/UI scaffold,
              ElevenLabs for narration, and Gemini for summarization — all on top of Y Combinator's public Hacker News API.
            </p>
            <div className="cta-meta">
              <div className="cta-meta-pill">▲ Real HN API</div>
              <div className="cta-meta-pill">▲ Live audio narration</div>
              <div className="cta-meta-pill">▲ Daily podcast feed</div>
              <div className="cta-meta-pill">▲ Open source</div>
            </div>
          </div>
          <div className="cta-right">
            <div className="badge-cluster">
              <div className="badge b-eleven">
                <div className="badge-icon eleven">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 6v12M12 6v12M15 6v12" strokeLinecap="round" /></svg>
                </div>
                <div className="badge-text">
                  <div className="badge-l1">VOICE BY</div>
                  <div className="badge-l2">ElevenLabs</div>
                </div>
              </div>
              <div className="badge b-yc">
                <div className="badge-icon yc">Y</div>
                <div className="badge-text">
                  <div className="badge-l1">DATA FROM</div>
                  <div className="badge-l2">Y Combinator HN</div>
                </div>
              </div>
              <div className="badge b-v0">
                <div className="badge-icon v0">v0</div>
                <div className="badge-text">
                  <div className="badge-l1">UI SCAFFOLDED IN</div>
                  <div className="badge-l2">Vercel v0</div>
                </div>
              </div>
              <div className="badge b-firecrawl">
                <div className="badge-icon firecrawl">
                  <img src="/firecrawl-logo.svg" width="16" height="16" alt="Firecrawl" style={{ objectFit: 'contain' }} />
                </div>
                <div className="badge-text">
                  <div className="badge-l1">SCRAPED BY</div>
                  <div className="badge-l2">Firecrawl</div>
                </div>
              </div>
              <div className="badge b-gemini">
                <div className="badge-icon gemini">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <defs><linearGradient id="gb" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="1" stopColor="rgba(255,255,255,0.7)"/></linearGradient></defs>
                    <path d="M12 2L13.8 10.2L22 12L13.8 13.8L12 22L10.2 13.8L2 12L10.2 10.2L12 2Z" fill="url(#gb)"/>
                  </svg>
                </div>
                <div className="badge-text">
                  <div className="badge-l1">SUMMARIZED BY</div>
                  <div className="badge-l2">Gemini</div>
                </div>
              </div>
              <div className="badge b-cloudflare">
                <div className="badge-icon cloudflare">
                  <svg width="22" height="14" viewBox="361 0 342 155" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M674.9 91.8L632 67.2l-7.4-3.2-175.5 1.2v89.1h225.8z" fill="#fff"/>
                    <path fill="#F38020" d="M596.8 146c2.1-7.2 1.3-13.8-2.2-18.7-3.2-4.5-8.6-7.1-15.1-7.4l-123.1-1.6c-.8 0-1.5-.4-1.9-1-.4-.6-.5-1.4-.3-2.2.4-1.2 1.6-2.1 2.9-2.2l124.2-1.6c14.7-.7 30.7-12.6 36.3-27.2l7.1-18.5c.3-.8.4-1.6.2-2.4C616.9 27 584.6 0 546 0c-35.6 0-65.8 23-76.6 54.9-7-5.2-15.9-8-25.5-7.1-17.1 1.7-30.8 15.4-32.5 32.5-.4 4.4-.1 8.7.9 12.7-27.9.8-50.2 23.6-50.2 51.7 0 2.5.2 5 .5 7.5.2 1.2 1.2 2.1 2.4 2.1h227.2c1.3 0 2.5-.9 2.9-2.2z"/>
                    <path fill="#FAAE40" d="M636 67.1c-1.1 0-2.3 0-3.4.1-.8 0-1.5.6-1.8 1.4L626 85.3c-2.1 7.2-1.3 13.8 2.2 18.7 3.2 4.5 8.6 7.1 15.1 7.4l26.2 1.6c.8 0 1.5.4 1.9 1 .4.6.5 1.5.3 2.2-.4 1.2-1.6 2.1-2.9 2.2l-27.3 1.6c-14.8.7-30.7 12.6-36.3 27.2l-2 5.1c-.4 1 .3 2 1.4 2h93.8c1.1 0 2.1-.7 2.4-1.8 1.6-5.8 2.5-11.9 2.5-18.2 0-37-30.2-67.2-67.3-67.2"/>
                  </svg>
                </div>
                <div className="badge-text">
                  <div className="badge-l1">MEDIA STORED ON</div>
                  <div className="badge-l2">Cloudflare R2</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-left">
            <span className="footer-mark" style={{ position: 'relative', width: 24, height: 18 }}>
              Y
            </span>
            HN++ &nbsp;·&nbsp; ElevenHacks 2026 &nbsp;·&nbsp; not affiliated with Y Combinator &nbsp;·&nbsp; built by <a href="https://x.com/__padmanabhan" target="_blank" rel="noopener" className="footer-link">Limb</a>
          </div>
          <div className="footer-right">
            <Link className="footer-link" href="/feed">Feed</Link>
            <Link className="footer-link" href="/highlights">Highlights</Link>
            <Link className="footer-link" href="/podcast">Podcast</Link>
            <a className="footer-link" href="https://news.ycombinator.com" target="_blank" rel="noopener">
              Original HN ↗
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}

function Feature({
  tag, title, icon, children, violet = false,
}: { tag: string; title: string; icon: React.ReactNode; children: React.ReactNode; violet?: boolean }) {
  return (
    <div className="feature-card">
      <div className={`feature-icon ${violet ? 'violet' : ''}`}>{icon}</div>
      <div className="feature-tag">{tag}</div>
      <div className="feature-title">{title}</div>
      <div className="feature-desc">{children}</div>
    </div>
  );
}


function Stat({ n, lbl }: { n: string; lbl: string }) {
  return (
    <div className="stat">
      <div className="stat-num">{n}</div>
      <div className="stat-lbl">{lbl}</div>
    </div>
  );
}
