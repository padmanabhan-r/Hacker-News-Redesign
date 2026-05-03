'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useStories } from '@/hooks/use-stories';
import { categorize, gradientForCat, getLinkPreview, getFavicon, parseDomain, timeAgo, CAT_EMOJI, type HNItem } from '@/lib/hn';
import { generateThumbnail } from '@/lib/thumbnail';
import { TalkBotButton } from './talk-bot-button';
import { SubmitButton } from './submit-button';
import { LoginModal, UserChip, getStoredUser, clearStoredUser, type HNUser } from '@/components/login-modal';

const ALL_CATS = ['All', 'AI', 'Security', 'Hardware', 'Startups', 'Engineering', 'Web', 'Science', 'Business'];

const SearchIco = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const MicIco = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const PlusIco = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const SunIco = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>;
const MoonIco = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
const StarIco = () => <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>;
const MsgIco = () => <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
const ArrowIco = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>;
const PlayIco = () => <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>;
const PauseIco = () => <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const SpinIco = () => <svg className="hn-spinner" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>;
const ChevLIco = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6"/></svg>;
const SkipFIco = () => <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" fill="none"/></svg>;
const XIco = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

type ListenButtonState = { playing: boolean; loading: boolean };
function listenLabel({ playing, loading }: ListenButtonState, msg?: string) {
  return loading ? (msg || 'Fetching…') : playing ? 'Playing' : 'Listen';
}
function listenIcon({ playing, loading }: ListenButtonState) {
  if (loading) return <SpinIco />;
  return playing ? <PauseIco /> : <PlayIco />;
}

function ListenOverlay({ playing, loading, onClick, style }: ListenButtonState & { onClick: (e: React.MouseEvent) => void; style?: React.CSSProperties }) {
  return (
    <button
      type="button"
      className={`listen-overlay${playing ? ' playing' : ''}${loading ? ' loading' : ''}`}
      onClick={onClick}
      disabled={loading}
      style={style}
      aria-label={listenLabel({ playing, loading })}
      title={listenLabel({ playing, loading })}
    >
      {listenIcon({ playing, loading })}
    </button>
  );
}

function ListenPill({ playing, loading, msg, onClick }: ListenButtonState & { msg?: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      className={`listen-pill${playing ? ' playing' : ''}${loading ? ' loading' : ''}`}
      onClick={onClick}
      disabled={loading}
      aria-label={listenLabel({ playing, loading }, msg)}
    >
      {listenIcon({ playing, loading })}
      {listenLabel({ playing, loading }, msg)}
    </button>
  );
}

function CatPill({ cat }: { cat: { label: string; color: string; bg: string } }) {
  return (
    <span className="card-category" style={{ color: cat.color, background: cat.bg, border: `1px solid ${cat.color}28` }}>
      {cat.label}
    </span>
  );
}

function useThumb(story: HNItem | undefined) {
  // Always have a thumbnail. Canvas is generated on mount; Microlink upgrades on success.
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    if (!story) return;
    setThumb(generateThumbnail(story));
    if (!story.url) return;
    const preview = getLinkPreview(story);
    if (!preview) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setThumb(preview); };
    img.src = preview;
    return () => { cancelled = true; };
  }, [story?.id, story?.url]);
  return thumb;
}

type CardAudioProps = { audioStoryId?: number; audioPlaying: boolean; audioLoading: boolean; audioMsg?: string };

function HeroCard({ story, onOpen, onListen, audioStoryId, audioPlaying, audioLoading }: { story?: HNItem; onOpen: (s: HNItem) => void; onListen: (s: HNItem) => void } & CardAudioProps) {
  const thumb = useThumb(story);
  if (!story) return <div className="hero-card"><div className="sk" style={{ position: 'absolute', inset: 0, borderRadius: 20 }} /></div>;
  const cat = categorize(story.title);
  const fav = story.url ? getFavicon(story.url, 64) : null;
  const bg = thumb || gradientForCat(cat);
  const isCurrent = audioStoryId === story.id;
  const playing = isCurrent && audioPlaying;
  const loading = isCurrent && audioLoading;
  return (
    <div className="hero-card" onClick={() => onOpen(story)}>
      <div className="hero-card-bg" style={{ backgroundImage: thumb ? `url(${thumb})` : bg }} />
      <div className="hero-card-overlay" />
      {fav && <img src={fav} alt="" style={{ position: 'absolute', top: 14, right: 14, width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.92)', padding: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 3 }} />}
      <div className="hero-card-number">01</div>
      <div className="hero-card-content">
        <CatPill cat={cat} />
        <div className="card-title-hero">{story.title}</div>
        <div className="card-byline">
          <span>{story.by}</span>
          <span className="card-byline-dot" />
          <span>{timeAgo(story.time)}</span>
          <span className="card-score"><StarIco /> {story.score ?? 0}</span>
        </div>
      </div>
      <ListenOverlay playing={playing} loading={loading} onClick={(e) => { e.stopPropagation(); onListen(story); }} style={{ top: 13, right: 46 }} />
    </div>
  );
}

function SecondaryCard({ story, num, onOpen, onListen, audioStoryId, audioPlaying, audioLoading }: { story?: HNItem; num: number; onOpen: (s: HNItem) => void; onListen: (s: HNItem) => void } & CardAudioProps) {
  const thumb = useThumb(story);
  if (!story) return <div className="secondary-card"><div className="sk" style={{ position: 'absolute', inset: 0, borderRadius: 16 }} /></div>;
  const cat = categorize(story.title);
  const fav = story.url ? getFavicon(story.url, 48) : null;
  const bg = thumb || gradientForCat(cat);
  const isCurrent = audioStoryId === story.id;
  const playing = isCurrent && audioPlaying;
  const loading = isCurrent && audioLoading;
  return (
    <div className="secondary-card" onClick={() => onOpen(story)}>
      <div className="secondary-card-bg" style={{ backgroundImage: thumb ? `url(${thumb})` : bg }} />
      <div className="secondary-card-overlay" />
      {fav && <img src={fav} alt="" style={{ position: 'absolute', top: 11, left: 12, width: 20, height: 20, borderRadius: 5, background: 'rgba(255,255,255,0.92)', padding: 2.5, boxShadow: '0 3px 10px rgba(0,0,0,0.4)', zIndex: 3 }} />}
      <div style={{ position: 'absolute', top: 12, right: 14, fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: 'rgba(255,255,255,0.07)', lineHeight: 1, letterSpacing: -2, userSelect: 'none' }}>
        {String(num).padStart(2, '0')}
      </div>
      <div className="secondary-card-content">
        <CatPill cat={cat} />
        <div className="card-title-secondary">{story.title}</div>
        <div className="card-byline" style={{ fontSize: 10.5 }}>
          <span>{story.by}</span>
          <span className="card-byline-dot" />
          <span>{timeAgo(story.time)}</span>
          <span className="card-score" style={{ fontSize: 9.5 }}><StarIco /> {story.score ?? 0}</span>
        </div>
      </div>
      <ListenOverlay playing={playing} loading={loading} onClick={(e) => { e.stopPropagation(); onListen(story); }} style={{ top: 8, left: 38 }} />
    </div>
  );
}

function HeadlinesPanel({ stories, onOpen }: { stories: HNItem[]; onOpen: (s: HNItem) => void }) {
  return (
    <div className="headlines-panel">
      <div className="headlines-header">
        <div className="headlines-header-top">
          <span className="headlines-label">Top Headlines</span>
          <span className="popular-icon">📈</span>
        </div>
        <div className="headlines-sub">Updated just now</div>
      </div>
      <div className="headlines-list">
        {stories.slice(5, 14).map((s, i) => (
          <button
            key={s?.id || i}
            type="button"
            className="headline-item"
            onClick={() => s && onOpen(s)}
          >
            <div className="headline-pip" />
            <span className="headline-text">{s?.title || '…'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LatestItem({ story, onOpen, onListen, audioStoryId, audioPlaying, audioLoading, audioMsg }: { story: HNItem; onOpen: (s: HNItem) => void; onListen: (s: HNItem) => void } & CardAudioProps) {
  const cat = categorize(story.title);
  const emoji = CAT_EMOJI[cat.label] || '💡';
  const thumb = useThumb(story);
  const fav = story.url ? getFavicon(story.url, 32) : null;
  const isCurrent = audioStoryId === story.id;
  const playing = isCurrent && audioPlaying;
  const loading = isCurrent && audioLoading;
  const msg = isCurrent ? audioMsg : undefined;
  return (
    <div className="latest-item" onClick={() => onOpen(story)}>
      {thumb ? (
        <div className="latest-thumb" style={{ backgroundImage: `url(${thumb})`, position: 'relative' }}>
          {fav && <img src={fav} alt="" style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 3, background: 'rgba(255,255,255,0.92)', padding: 1.5 }} />}
        </div>
      ) : (
        <div className="latest-thumb-fallback" style={{ background: gradientForCat(cat) }}>
          <span style={{ fontSize: 26, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>{emoji}</span>
        </div>
      )}
      <div className="latest-body">
        <div className="latest-category" style={{ color: cat.color }}>{cat.label}</div>
        <div className="latest-title">{story.title}</div>
        <div className="latest-meta">
          <span>{story.by}</span>
          <span>·</span>
          <span>{timeAgo(story.time)}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><StarIco /> {story.score ?? 0}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MsgIco /> {story.descendants ?? 0}</span>
            <ListenPill playing={playing} loading={loading} msg={msg} onClick={(e) => { e.stopPropagation(); onListen(story); }} />
          </span>
        </div>
      </div>
    </div>
  );
}

function PopularPanel({ stories, onOpen }: { stories: HNItem[]; onOpen: (s: HNItem) => void }) {
  return (
    <div className="side-panel">
      <div className="side-panel-heading">
        <div className="side-panel-dot" />
        <span className="side-panel-title">Most Discussed</span>
      </div>
      {[...stories]
        .sort((a, b) => (b?.descendants ?? 0) - (a?.descendants ?? 0))
        .slice(0, 6)
        .map((s, i) => (
          <button key={s?.id || i} type="button" className="pop-item" onClick={() => onOpen(s)}>
            <span className="pop-num">{i + 1}</span>
            <span className="pop-text">{s?.title}</span>
          </button>
        ))}
    </div>
  );
}


export function HighlightsShell() {
  const { items, isLoading } = useStories('top', 1, 40);
  const [activeCat, setActiveCat] = useState('All');
  const router = useRouter();
  const openStory = (s: HNItem) => router.push(`/feed?id=${s.id}`);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<HNUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  useEffect(() => { setMounted(true); setUser(getStoredUser()); }, []);
  const isDark = mounted && theme === 'dark';

  const [audioStory, setAudioStory] = useState<HNItem | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioMsg, setAudioMsg] = useState('Fetching…');
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      audioRef.current = null;
      blobUrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!audioLoading) return;
    const start = Date.now();
    const STEPS: Array<[number, string]> = [
      [0,     'Fetching…'],
      [1500,  'Reading…'],
      [3500,  'Thinking…'],
      [6000,  'Casting…'],
      [9000,  'Baking…'],
      [13000, 'Almost there…'],
      [18000, 'Hang tight…'],
    ];
    const tick = () => {
      const ms = Date.now() - start;
      let cur = STEPS[0][1];
      for (const [t, s] of STEPS) if (ms >= t) cur = s;
      setAudioMsg(cur);
    };
    tick();
    const id = setInterval(tick, 400);
    return () => clearInterval(id);
  }, [audioLoading]);

  function stopAudio() {
    audioRef.current?.pause();
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    audioRef.current = null;
    blobUrlRef.current = null;
    setAudioPlaying(false);
    setAudioProgress(0);
  }

  async function handleListen(story: HNItem) {
    if (audioStory?.id === story.id && audioRef.current) {
      if (audioPlaying) audioRef.current.pause();
      else audioRef.current.play();
      return;
    }
    if (audioLoading) return;
    stopAudio();
    setAudioStory(story);
    setAudioProgress(0);
    setAudioLoading(true);
    try {
      const r = await fetch('/api/listen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: story.id }),
      });
      if (!r.ok) throw new Error('listen failed');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const a = new Audio(url);
      audioRef.current = a;
      a.addEventListener('play', () => setAudioPlaying(true));
      a.addEventListener('pause', () => setAudioPlaying(false));
      a.addEventListener('timeupdate', () => { if (a.duration) setAudioProgress(a.currentTime / a.duration); });
      a.addEventListener('ended', () => { setAudioPlaying(false); setAudioProgress(1); });
      await a.play();
    } catch (e) {
      console.error(e);
    } finally {
      setAudioLoading(false);
    }
  }

  const [searchInput, setSearchInput] = useState('');

  const filtered = useMemo(() => {
    let list = activeCat === 'All' ? items : items.filter((s) => categorize(s?.title ?? '').label === activeCat);
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      list = list.filter((s) => s.title?.toLowerCase().includes(q));
    }
    return list;
  }, [items, activeCat, searchInput]);

  return (
    <div className="highlights-page">
      <div className="pt-cover" aria-hidden><div className="pt-mark"><div className="pt-ring" /><div className="pt-logo">Y</div></div></div>
      <header className="hdr">
        <Link className="logo" href="/highlights">
          <div className="logo-box" aria-label="HN++" style={{ position: 'relative' }}>
            Y
          </div>
          <span className="logo-rotator">
            <span className="logo-rot-spacer">A HACKER NEWS REDESIGN</span>
            <span className="logo-rot-item r1">HN<span style={{ color: 'var(--accent)' }}>++</span></span>
            <span className="logo-rot-item r2">A Hacker News Redesign</span>
          </span>
        </Link>
        <nav className="hnav">
          <button type="button" className="hnav-btn active">✦ Highlights</button>
          <Link className="hnav-btn" href="/feed">Feed</Link>
          <Link className="hnav-btn" href="/podcast"><MicIco /> Podcast</Link>
        </nav>
        <div className="search-wrap">
          <span className="search-ico"><SearchIco /></span>
          <input className="search-input" placeholder="Search stories…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <span className="search-kbd">⌘K</span>
        </div>
        <div className="hdr-right">
          <TalkBotButton />
          <button
            type="button"
            className="theme-toggle"
            title="Toggle theme"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? <SunIco /> : <MoonIco />}
          </button>
          <SubmitButton />
          {user ? (
            <UserChip user={user} onLogout={() => { clearStoredUser(); setUser(null); }} />
          ) : (
            <button type="button" className="login-btn" onClick={() => setShowLogin(true)}>Log in</button>
          )}
        </div>
      </header>

      <div className="page-body">
        <div className="page-inner">

          <div className="section-row">
            <h2 className="section-title">Today's Highlights</h2>
            <Link href="/feed" className="section-see-more" style={{ marginLeft: 'auto', textDecoration: 'none' }}>See all <ArrowIco /></Link>
          </div>

          {isLoading && !items.length ? (
            <div style={{ height: 440, borderRadius: 20, marginBottom: 36 }} className="sk" />
          ) : (
            <div className="hero-grid">
              <HeroCard story={items[0]} onOpen={openStory} onListen={handleListen} audioStoryId={audioStory?.id} audioPlaying={audioPlaying} audioLoading={audioLoading} />
              <div className="secondary-col">
                <SecondaryCard story={items[1]} num={2} onOpen={openStory} onListen={handleListen} audioStoryId={audioStory?.id} audioPlaying={audioPlaying} audioLoading={audioLoading} />
                <SecondaryCard story={items[2]} num={3} onOpen={openStory} onListen={handleListen} audioStoryId={audioStory?.id} audioPlaying={audioPlaying} audioLoading={audioLoading} />
              </div>
              <div className="secondary-col">
                <SecondaryCard story={items[3]} num={4} onOpen={openStory} onListen={handleListen} audioStoryId={audioStory?.id} audioPlaying={audioPlaying} audioLoading={audioLoading} />
                <SecondaryCard story={items[4]} num={5} onOpen={openStory} onListen={handleListen} audioStoryId={audioStory?.id} audioPlaying={audioPlaying} audioLoading={audioLoading} />
              </div>
              <HeadlinesPanel stories={items} onOpen={openStory} />
            </div>
          )}

          <div className="category-chips">
            {ALL_CATS.map((c) => (
              <button
                key={c}
                type="button"
                className={`cat-chip${activeCat === c ? ' active' : ''}`}
                onClick={() => setActiveCat(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="section-row">
            <h2 className="section-title" style={{ fontSize: 20 }}>
              {activeCat === 'All' ? 'Latest Stories' : `${activeCat} Stories`}
            </h2>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--text-muted)' }}>
              {filtered.length} stories
            </span>
          </div>

          <div className="latest-grid">
            <div className="latest-feed">
              {isLoading && !items.length
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="latest-item" style={{ pointerEvents: 'none' }}>
                      <div className="sk" style={{ width: 80, height: 60, borderRadius: 10, flexShrink: 0 }} />
                      <div>
                        <div className="sk" style={{ height: 9, width: 80, marginBottom: 8 }} />
                        <div className="sk" style={{ height: 12, width: '90%', marginBottom: 6 }} />
                        <div className="sk" style={{ height: 9, width: 120 }} />
                      </div>
                    </div>
                  ))
                : (() => {
                    const list = (activeCat === 'All' && !searchInput.trim()) ? filtered.slice(3) : filtered;
                    if (list.length === 0) {
                      return (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                          Nothing in <strong style={{ color: 'var(--text-2)' }}>{activeCat}</strong> right now. Try another tag.
                        </div>
                      );
                    }
                    return list.map((s) => (
                      <LatestItem key={s.id} story={s} onOpen={openStory} onListen={handleListen} audioStoryId={audioStory?.id} audioPlaying={audioPlaying} audioLoading={audioLoading} audioMsg={audioMsg} />
                    ));
                  })()}
            </div>

            <div className="side-panels">
              {!isLoading && <PopularPanel stories={items} onOpen={openStory} />}
            </div>
          </div>

        </div>
      </div>
      {audioStory && (
        <div className="audio-player-bar">
          <div className="ap-thumb" style={{ backgroundImage: getLinkPreview(audioStory) ? `url(${getLinkPreview(audioStory)})` : undefined }} />
          <div className="ap-info">
            <div className="ap-title">{audioStory.title}</div>
            <div className="ap-sub">{audioLoading ? audioMsg : `Story audio · ${audioStory.by}`}</div>
          </div>
          <div className="ap-controls">
            <button type="button" className="ap-skip" aria-label="Back"><ChevLIco /></button>
            <button
              type="button"
              className="ap-play-btn"
              onClick={() => handleListen(audioStory)}
              disabled={audioLoading}
              aria-label={audioLoading ? 'Loading' : audioPlaying ? 'Pause' : 'Play'}
            >
              {audioLoading ? <SpinIco /> : audioPlaying ? <PauseIco /> : <PlayIco />}
            </button>
            <button type="button" className="ap-skip" aria-label="Forward"><SkipFIco /></button>
          </div>
          <div className="ap-progress-wrap">
            <div className="ap-progress-track">
              <div className="ap-progress-fill" style={{ width: `${Math.min(100, Math.max(0, audioProgress * 100))}%` }} />
            </div>
          </div>
          <span className="ap-time">{Math.round(audioProgress * 100)}%</span>
          <button
            type="button"
            className="ap-close"
            onClick={() => { stopAudio(); setAudioStory(null); }}
            aria-label="Close"
          >
            <XIco />
          </button>
        </div>
      )}
      {showLogin && <LoginModal onLogin={(u) => { setUser(u); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
    </div>
  );
}

// Kept for reference; no longer rendered. Card clicks now route to /feed?id=…
function _StoryModal({ story, onClose }: { story: HNItem; onClose: () => void }) {
  return (
    <div
      role="dialog"
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(6,8,16,0.92)',
        backdropFilter: 'blur(24px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 20px', overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        maxWidth: 720, width: '100%',
        background: 'rgba(255,255,255,0.045)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 22,
        padding: 32,
        position: 'relative',
        backdropFilter: 'blur(32px)',
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: 18, right: 18,
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
        <div style={{ marginBottom: 10 }}>
          <CatPill cat={categorize(story.title)} />
        </div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.35, color: 'white', marginBottom: 14, textWrap: 'pretty' }}>{story.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          {parseDomain(story.url) && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: 'rgba(255,102,0,0.8)' }}>{parseDomain(story.url)}</span>}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>by {story.by}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>★ {story.score} pts</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>💬 {story.descendants ?? 0}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{timeAgo(story.time)}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {story.url && (
            <a href={story.url} target="_blank" rel="noopener" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              height: 36, padding: '0 18px',
              background: 'linear-gradient(135deg,#ff6600,#ff8c00)',
              borderRadius: 10, color: 'white',
              fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 0 0 1px rgba(255,102,0,0.3),0 4px 16px rgba(255,102,0,0.25)',
            }}>Visit site →</a>
          )}
          <Link href={`/feed?id=${story.id}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            height: 36, padding: '0 16px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, color: 'rgba(255,255,255,0.6)',
            fontFamily: "'Syne',sans-serif", fontSize: 13,
            textDecoration: 'none',
          }}>Open thread</Link>
          <a href={`https://news.ycombinator.com/item?id=${story.id}`} target="_blank" rel="noopener" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            height: 36, padding: '0 16px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, color: 'rgba(255,255,255,0.6)',
            fontFamily: "'Syne',sans-serif", fontSize: 13,
            textDecoration: 'none',
          }}>View on HN</a>
        </div>
      </div>
    </div>
  );
}
