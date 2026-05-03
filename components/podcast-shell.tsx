'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useStories } from '@/hooks/use-stories';
import { categorize, getLinkPreview, type HNItem } from '@/lib/hn';
import { CAST, type CastMember } from '@/lib/voice-cast';

const Ico = {
  Play: () => <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>,
  Pause: () => <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>,
  SkipB: () => <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><polygon points="19,20 9,12 19,4" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" fill="none" /></svg>,
  SkipF: () => <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" fill="none" /></svg>,
  ChevL: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6" /></svg>,
  Mic: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
  Vol: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></svg>,
  Star: () => <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" /></svg>,
  Search: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
};

type WordTimestamp = { word: string; startMs: number; endMs: number };
type LineMeta = {
  speaker: string;
  persona: string;
  text: string;
  startMs: number;
  endMs: number;
  words?: WordTimestamp[];
};
type Episode = {
  audioUrl: string;
  lines: LineMeta[];
  cast: CastMember[];
  storyTitle: string;
};

function Waveform({ playing, bars = 48 }: { playing: boolean; bars?: number }) {
  const heights = useMemo(
    () => Array.from({ length: bars }, (_, i) => 8 + (Math.sin(i * 0.4) * 0.5 + 0.5) * 32),
    [bars]
  );
  return (
    <div className="waveform">
      {heights.map((h, i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            width: 3,
            height: playing ? `${h}px` : '4px',
            opacity: playing ? 0.7 + Math.sin(i * 0.3) * 0.3 : 0.3,
            animationName: playing ? 'wave' : 'none',
            animationDuration: `${0.8 + (i % 5) * 0.1}s`,
            animationDelay: `${i * 0.04}s`,
            animationIterationCount: 'infinite',
            transition: 'height 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

function fmtTime(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function PodcastShell() {
  const { items: stories, isLoading } = useStories('top', 1, 10);
  const [storyId, setStoryId] = useState<number | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [vol, setVol] = useState(80);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === 'dark';

  useEffect(() => {
    if (!storyId && stories.length) setStoryId(stories[0].id);
  }, [stories, storyId]);

  const selected = stories.find((s) => s.id === storyId) || stories[0];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  async function generate() {
    if (!selected) return;
    setGenerating(true);
    setEpisode(null);
    setNow(0);
    setPlaying(false);
    try {
      const r = await fetch('/api/podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: selected.id }),
      });
      if (!r.ok) throw new Error('podcast api failed');
      const data: Episode = await r.json();
      setEpisode(data);
      setTimeout(() => audioRef.current?.play().catch(() => {}), 50);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  function togglePlay() {
    const a = audioRef.current;
    if (!episode) { generate(); return; }
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = Math.max(0, Math.min(a.duration, ratio * a.duration));
  }

  const dur = audioRef.current?.duration ?? 0;
  const progress = episode && dur ? now / dur : 0;
  const timeStr = `${fmtTime(now)} / ${fmtTime(dur)}`;

  // Active line based on currentTime
  const activeLineIdx = episode
    ? episode.lines.findIndex((l) => now * 1000 >= l.startMs && now * 1000 < l.endMs)
    : -1;

  return (
    <div className="podcast-page">
      <div className="pt-cover" aria-hidden><div className="pt-mark"><div className="pt-ring" /><div className="pt-logo">Y<span className="pt-plus">++</span></div></div></div>
      <header className="hdr">
        <Link className="logo" href="/highlights">
          <div className="logo-box" aria-label="HN++" style={{ position: 'relative' }}>
            Y
            <span style={{ position: 'absolute', top: '-6px', right: '-9px', background: 'white', color: 'var(--accent)', fontFamily: "'Syne', sans-serif", fontSize: '8px', fontWeight: 800, borderRadius: '4px', padding: '1px 3px', lineHeight: '1' }}>++</span>
          </div>
          <span className="logo-rotator">
            <span className="logo-rot-spacer">A HACKER NEWS REDESIGN</span>
            <span className="logo-rot-item r1">HN<span style={{ color: 'var(--accent)' }}>++</span></span>
            <span className="logo-rot-item r2">A Hacker News Redesign</span>
          </span>
        </Link>
        <nav className="hnav">
          <Link className="hnav-btn" href="/highlights">✦ Highlights</Link>
          <Link className="hnav-btn" href="/feed">Feed</Link>
          <button type="button" className="hnav-btn active"><Ico.Mic /> Podcast</button>
        </nav>
        <div className="search-wrap">
          <span className="search-ico"><Ico.Search /></span>
          <input className="search-input" placeholder="Search episodes…" />
          <span className="search-kbd">⌘K</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            style={{ height: 30, width: 30, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}
            aria-label="Toggle theme"
          >
            {isDark ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <div className="pod-page">

        {/* Story selector / generate prompt */}
        <div className="key-section">
          <div className="key-section-head">
            <div className="key-section-title"><Ico.Mic /> Multi-voice dialogue podcast</div>
            <span className="powered-pill">
              <span className="el-mark" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14"><rect x="5" y="4" width="4" height="16" rx="1" fill="currentColor" /><rect x="15" y="4" width="4" height="16" rx="1" fill="currentColor" /></svg>
              </span>
              Powered by ElevenLabs · text-to-dialogue v3
            </span>
          </div>
          <div className="key-section-sub">
            Pick any front-page story. We pull the thread, cast 8 voices to authors, generate a multi-voice debate and align word-by-word.
            {selected && <> · Currently: <strong>{selected.title}</strong></>}
          </div>
          <div className="key-row">
            <button
              type="button"
              className="key-save-btn"
              disabled={generating || !selected}
              onClick={generate}
            >
              {generating ? '… generating' : episode ? 'Regenerate' : 'Generate episode'}
            </button>
          </div>
        </div>

        {/* Header grid */}
        <div className="pod-header">
          <div className="pod-main">
            <div className="pod-badge">
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'hn-pulse 1.5s ease-in-out infinite' }} />
              Daily Episode
            </div>
            <div className="pod-ep-date">HN Daily · {today}</div>
            <div className="pod-ep-sub">
              {selected ? selected.title : 'Loading the front page…'}
              {episode ? ` · ${episode.lines.length} exchanges` : ' · select & generate'}
            </div>

            <Waveform playing={playing} bars={48} />

            <div className="player-controls">
              <button type="button" className="skip-btn" onClick={() => audioRef.current && (audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10))}><Ico.SkipB /></button>
              <button type="button" className="play-btn" onClick={togglePlay} disabled={generating || isLoading}>
                {generating ? '…' : playing ? <Ico.Pause /> : <Ico.Play />}
              </button>
              <button type="button" className="skip-btn" onClick={() => audioRef.current && (audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10))}><Ico.SkipF /></button>
              <div className="progress-track" onClick={seek}>
                <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
              </div>
              <span className="time-label">{timeStr}</span>
            </div>

            <div className="vol-row" style={{ marginBottom: 16 }}>
              <span className="vol-icon"><Ico.Vol /></span>
              <input
                type="range" className="vol-slider" min={0} max={100} value={vol}
                onChange={(e) => {
                  const v = +e.target.value;
                  setVol(v);
                  if (audioRef.current) audioRef.current.volume = v / 100;
                }}
              />
            </div>

            <div className="pod-ep-tags" style={{ marginTop: 14 }}>
              {['AI', 'Engineering', 'Startups', 'Security', 'Web'].map((t) => (
                <span key={t} className="pod-tag">{t}</span>
              ))}
            </div>
          </div>

          {/* Hosts */}
          <div className="hosts-panel">
            <div className="hosts-title">Voice Cast</div>
            {(episode?.cast ?? CAST.slice(0, 4)).map((c) => {
              const speaking = !!episode && activeLineIdx >= 0 && episode.lines[activeLineIdx]?.persona === c.role;
              return (
                <div key={c.persona} className="host-card" style={speaking ? { borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' } : {}}>
                  <div className="host-avatar" style={{ background: 'rgba(255,140,40,0.18)' }}>
                    {c.name[0]}
                  </div>
                  <div>
                    <div className="host-name">{c.name}</div>
                    <div className="host-role">{c.role}</div>
                    <div className="host-voice-pill">
                      {speaking && playing && <div className="speaking-dot" />}
                      ElevenLabs v3
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Episode info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  ['Format', 'Multi-voice dialogue'],
                  ['Engine', 'Text-to-Dialogue v3'],
                  ['Sync', 'Forced alignment'],
                  ['Source', 'Top HN'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{l}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-2)', fontFamily: "'JetBrains Mono',monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transcript */}
        {episode && episode.lines.length > 0 && (
          <div className="script-section">
            <div className="script-section-title">
              Transcript
              <span className="script-badge">{playing ? 'Live' : 'Preview'}</span>
            </div>
            {episode.lines.map((l, i) => (
              <div
                key={i}
                className={`exchange-block host-${i % 2 === 0 ? 'a' : 'b'}${i === activeLineIdx ? ' active' : ''}`}
              >
                <div className="ex-avatar" style={{ background: i % 2 === 0 ? 'rgba(255,170,80,0.18)' : 'rgba(255,102,0,0.18)' }}>
                  {l.speaker[0]}
                </div>
                <div>
                  <div className={`ex-name ${i % 2 === 0 ? 'a' : 'b'}`}>{l.speaker}</div>
                  <div className={`ex-text${i === activeLineIdx ? ' active-word' : ''}`}>
                    {l.words?.length ? (
                      <KaraokeText words={l.words} now={now * 1000} />
                    ) : l.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stories grid */}
        {!isLoading && stories.length > 0 && (
          <div className="script-section">
            <div className="script-section-title">Pick another story</div>
            <div className="stories-grid">
              {stories.slice(0, 10).map((s) => {
                const cat = categorize(s.title);
                const thumb = getLinkPreview(s);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setStoryId(s.id); setEpisode(null); setNow(0); setPlaying(false); }}
                    className="story-tile"
                    style={storyId === s.id ? { borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' } : {}}
                  >
                    <div
                      className="story-tile-thumb"
                      style={{
                        backgroundImage: thumb ? `url(${thumb})` : `linear-gradient(135deg, ${cat.color}66, ${cat.color}22)`,
                      }}
                    />
                    <div>
                      <div className="story-tile-title">{s.title}</div>
                      <div className="story-tile-meta">
                        <span><Ico.Star /> {s.score}</span>
                        <span>by {s.by}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sk" style={{ height: 44, borderRadius: 12 }} />)}
          </div>
        )}
      </div>

      {episode && (
        <audio
          ref={audioRef}
          src={episode.audioUrl}
          onTimeUpdate={(e) => setNow((e.target as HTMLAudioElement).currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}
    </div>
  );
}

function KaraokeText({ words, now }: { words: WordTimestamp[]; now: number }) {
  return (
    <>
      {words.map((w, i) => (
        <span
          key={i}
          className={`word ${now >= w.startMs && now < w.endMs ? 'is-speaking' : ''}`}
        >
          {w.word}{' '}
        </span>
      ))}
    </>
  );
}
