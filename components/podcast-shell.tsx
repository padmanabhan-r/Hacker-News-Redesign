'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import useSWR from 'swr';
import { LoginModal, UserChip, getStoredUser, clearStoredUser, type HNUser } from '@/components/login-modal';
import { TalkBotButton } from './talk-bot-button';
import { SubmitButton } from './submit-button';

const Ico = {
  Play: () => <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>,
  Pause: () => <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>,
  SkipB: () => <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><polygon points="19,20 9,12 19,4" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" fill="none" /></svg>,
  SkipF: () => <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" fill="none" /></svg>,
  Mic: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
  Vol: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></svg>,
  Search: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Sun: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
  Moon: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>,
  Plus: () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Feed: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="14" y2="18" /></svg>,
};

type Manifest = {
  date: string;
  runtimeMs: number;
  storyTitles: string[];
  host: { name: string; persona: string; voiceId: string };
  guest: { name: string; persona: string; voiceId: string };
  segments: { title: string; startMs: number; endMs: number }[];
  generatedAt: string;
  stale?: boolean;
  latestAvailable?: string;
};

function Waveform({ playing, progress = 0, chapters = [], bars = 48 }: {
  playing: boolean;
  progress?: number;
  chapters?: { percent: number }[];
  bars?: number;
}) {
  const heights = useMemo(
    () => Array.from({ length: bars }, (_, i) => 8 + (Math.sin(i * 0.4) * 0.5 + 0.5) * 32),
    [bars]
  );
  const headIndex = Math.max(0, Math.min(bars - 1, Math.floor(progress * bars)));
  return (
    <div className="waveform">
      {heights.map((h, i) => {
        const cls = `wave-bar${i < headIndex ? ' is-past' : ''}${i === headIndex && progress > 0 ? ' is-head' : ''}`;
        return (
          <div
            key={i}
            className={cls}
            style={{
              height: playing ? `${h}px` : '4px',
              animationName: playing ? 'wave' : 'none',
              animationDuration: `${0.8 + (i % 5) * 0.1}s`,
              animationDelay: `${i * 0.04}s`,
              animationIterationCount: 'infinite',
              transition: 'height 0.3s ease',
            }}
          />
        );
      })}
      {chapters.map((c, i) => (
        <span key={i} className="wave-chapter" style={{ left: `${c.percent}%` }} />
      ))}
      {progress > 0 && <span className="wave-playhead" style={{ left: `${progress * 100}%` }} />}
    </div>
  );
}

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function fmtDateShort(date: string): string {
  const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(dt);
}

function fmtDateLong(date: string): string {
  const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(dt);
}

function episodeNumber(date: string): string {
  const epoch = Date.UTC(2026, 0, 1);
  const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
  const days = Math.max(1, Math.round((Date.UTC(y, m - 1, d) - epoch) / 86400000) + 1);
  return String(days).padStart(3, '0');
}

const SpinIco = () => <svg className="hn-spinner" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function PodcastShell() {
  const { data: todayData, error: todayError } = useSWR<Manifest>('/api/podcast/today', fetcher, { revalidateOnFocus: false });
  const { data: archiveData } = useSWR<{ episodes: Manifest[] }>('/api/podcast/archive', fetcher, { revalidateOnFocus: false });

  const loading = !todayData && !todayError;
  const error = todayError ? 'No episode available yet. The cron will bake one shortly.' : null;
  const archive = archiveData?.episodes ?? [];

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [vol, setVol] = useState(80);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bedRef = useRef<HTMLAudioElement | null>(null);
  const [musicOn, setMusicOn] = useState(true);
  const [bedVol, setBedVol] = useState(0.18);
  const [searchInput, setSearchInput] = useState('');
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  async function handleVoiceSearch() {
    if (voiceState === 'recording') { mediaRecorderRef.current?.stop(); return; }
    if (voiceState === 'transcribing') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setVoiceState('transcribing');
        try {
          const fd = new FormData();
          fd.append('audio', new Blob(chunks, { type: 'audio/webm' }), 'voice.webm');
          const res = await fetch('/api/stt', { method: 'POST', body: fd });
          const { text } = await res.json() as { text: string };
          if (text) setSearchInput(text);
        } finally { setVoiceState('idle'); }
      };
      recorder.start();
      setVoiceState('recording');
    } catch { setVoiceState('idle'); }
  }

  const filteredArchive = useMemo(() => {
    if (!searchInput.trim()) return archive;
    const q = searchInput.toLowerCase();
    return archive.filter((ep) =>
      ep.date.includes(q) ||
      fmtDateLong(ep.date).toLowerCase().includes(q) ||
      ep.storyTitles.some((t) => t.toLowerCase().includes(q))
    );
  }, [archive, searchInput]);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<HNUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  useEffect(() => { setMounted(true); setUser(getStoredUser()); }, []);
  const isDark = mounted && theme === 'dark';

  useEffect(() => {
    if (todayData && !manifest) {
      setManifest(todayData);
      setActiveDate(todayData.date);
    }
  }, [todayData]);

  function selectEpisode(m: Manifest) {
    setManifest(m);
    setActiveDate(m.date);
    setNow(0);
    setPlaying(false);
    if (bedRef.current) { bedRef.current.currentTime = 0; bedRef.current.pause(); }
    setTimeout(() => audioRef.current?.play().catch(() => {}), 50);
  }

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play(); else a.pause();
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = Math.max(0, Math.min(a.duration, ratio * a.duration));
  }

  function jumpTo(ms: number) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = ms / 1000;
    a.play().catch(() => {});
  }

  // Keep music bed volume + on/off in sync with state
  useEffect(() => {
    const b = bedRef.current;
    if (!b) return;
    b.volume = musicOn ? bedVol : 0;
  }, [musicOn, bedVol]);

  const dur = audioRef.current?.duration ?? (manifest ? manifest.runtimeMs / 1000 : 0);
  const progress = manifest && dur ? now / dur : 0;

  const hostLabel = manifest ? `Hosted by ${manifest.host.name.replace(/^Anchor /, '')}, with today's guest ${manifest.guest.name} (our ${manifest.guest.persona})` : '';

  const audioSrc = activeDate ? `/api/podcast/audio/${activeDate}.mp3` : undefined;

  return (
    <div className="podcast-page">
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
          <Link className="hnav-btn" href="/highlights">✦ Highlights</Link>
          <Link className="hnav-btn" href="/feed"><Ico.Feed /> Feed</Link>
          <button type="button" className="hnav-btn active"><Ico.Mic /> Podcast</button>
        </nav>
        <div className="search-wrap">
          <span className="search-ico"><Ico.Search /></span>
          <input className="search-input" placeholder="Search episodes…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <button
            type="button"
            className="search-kbd"
            onClick={handleVoiceSearch}
            title={voiceState === 'recording' ? 'Stop recording' : 'Search by voice'}
            style={{
              cursor: 'pointer',
              color: voiceState === 'recording' ? 'var(--accent)' : voiceState === 'transcribing' ? 'var(--text-3)' : undefined,
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {voiceState === 'transcribing' ? <SpinIco /> : <Ico.Mic />}
          </button>
        </div>
        <div className="hdr-right">
          <TalkBotButton />
          <button type="button" className="theme-toggle" title="Toggle theme" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
            {isDark ? <Ico.Sun /> : <Ico.Moon />}
          </button>
          <SubmitButton />
          {user ? (
            <UserChip user={user} onLogout={() => { clearStoredUser(); setUser(null); }} />
          ) : (
            <button type="button" className="login-btn" onClick={() => setShowLogin(true)}>Log in</button>
          )}
        </div>
      </header>

      <div className="pod-page">
        <div className="key-section">
          <div className="key-section-head">
            <div className="key-section-title"><Ico.Mic /> HN++ Pod</div>
            <span className="powered-pill">
              <span className="el-mark" aria-hidden>11</span>
              <span className="el-label">Powered by ElevenLabs</span>
            </span>
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--accent)' }}>Podcast paused</strong> — new episodes have been stopped to conserve ElevenLabs credits. Archive episodes below are still available.
          </div>
          <div className="key-section-sub">
            A daily ~5 min show. Standard host plus a rotating guest dig into the day's top Hacker News stories,
            with the article and the comment crowd in mind. Fresh every morning at 7:00 AM IST · 1:30 AM GMT · 6:30 PM PT (prev day).
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.02em' }}>
            Episodes trimmed to ~5 min to conserve ElevenLabs credits.
          </div>
          {error && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-3)' }}>{error}</div>
          )}
          {manifest?.stale && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-3)' }}>
              Today's episode is still baking. You're hearing the most recent one ({fmtDateShort(manifest.date)}).
            </div>
          )}
        </div>

        <div className="pod-header">
          <div className="pod-main">
            {manifest && (
              <div className="pod-ep-stamp">
                <div className="pod-ep-stamp-num">{episodeNumber(manifest.date)}</div>
                <div className="pod-ep-stamp-label">episode</div>
              </div>
            )}
            <div className="pod-badge">
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'hn-pulse 1.5s ease-in-out infinite' }} />
              {manifest?.stale ? 'Latest episode' : 'Today\'s episode'}
            </div>
            {manifest ? (
              <>
                <div className="pod-ep-topic">
                  HN++ Pod · {fmtDateLong(manifest.date)}
                </div>
                <div className="pod-ep-sub-new">{hostLabel}</div>
              </>
            ) : (
              <div className="pod-ep-topic">{loading ? 'Loading episode…' : 'No episode available'}</div>
            )}

            <Waveform
              playing={playing}
              progress={progress}
              chapters={manifest && dur ? manifest.segments.slice(1).map((s) => ({ percent: (s.startMs / 1000 / dur) * 100 })) : []}
              bars={48}
            />

            <div className="player-controls">
              <button type="button" className="skip-btn" onClick={() => audioRef.current && (audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10))}><Ico.SkipB /></button>
              <button type="button" className="play-btn" onClick={togglePlay} disabled={!manifest}>
                {playing ? <Ico.Pause /> : <Ico.Play />}
              </button>
              <button type="button" className="skip-btn" onClick={() => audioRef.current && (audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10))}><Ico.SkipF /></button>
              <div className="progress-track" onClick={seek}>
                <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
                {manifest && dur > 0 && manifest.segments.slice(1).map((seg, i) => (
                  <span key={i} className="progress-tick" style={{ left: `${(seg.startMs / 1000 / dur) * 100}%` }} />
                ))}
                {progress > 0 && <span className="progress-head" style={{ left: `${progress * 100}%` }} />}
              </div>
              <div className="time-label-stack">
                <span className="time-cur">{fmtTime(now)}</span>
                <span className="time-tot">/ {fmtTime(dur)}</span>
              </div>
            </div>

            <div className="vol-row" style={{ marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
              <span className="vol-icon"><Ico.Vol /></span>
              <input
                type="range" className="vol-slider" min={0} max={100} value={vol}
                onChange={(e) => {
                  const v = +e.target.value;
                  setVol(v);
                  if (audioRef.current) audioRef.current.volume = v / 100;
                }}
                aria-label="Master volume"
              />
              <button
                type="button"
                onClick={() => setMusicOn((v) => !v)}
                style={{
                  height: 24, padding: '0 9px', borderRadius: 6,
                  background: musicOn ? 'var(--accent-bg)' : 'var(--bg-card)',
                  border: `1px solid ${musicOn ? 'var(--accent-border)' : 'var(--border)'}`,
                  color: musicOn ? 'var(--accent-text)' : 'var(--text-3)',
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, cursor: 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}
                aria-pressed={musicOn}
              >
                {musicOn ? '♫ music on' : '♫ music off'}
              </button>
              {musicOn && (
                <input
                  type="range" className="vol-slider" min={0} max={40} value={Math.round(bedVol * 100)}
                  onChange={(e) => setBedVol(+e.target.value / 100)}
                  style={{ maxWidth: 110 }}
                  aria-label="Music bed volume"
                />
              )}
            </div>
          </div>

          <div className="hosts-panel">
            <div className="hosts-title">Chapters <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 4, padding: '1px 5px', verticalAlign: 'middle' }}>beta</span></div>
            {!manifest && (
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{loading ? 'Loading…' : 'No chapters yet.'}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {manifest?.segments.map((seg, i) => {
                const isActive = now * 1000 >= seg.startMs && now * 1000 < seg.endMs;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => jumpTo(seg.startMs)}
                    title={seg.title}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '46px 1fr',
                      gap: 10,
                      alignItems: 'flex-start',
                      width: '100%',
                      minHeight: 28,
                      padding: '6px 10px',
                      borderRadius: 7,
                      background: isActive ? 'var(--accent-bg)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--accent-border)' : 'transparent'}`,
                      color: isActive ? 'var(--accent-text)' : 'var(--text-2)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 12,
                      lineHeight: 1.35,
                      fontFamily: "'Inter', sans-serif",
                      transition: 'background 0.12s, color 0.12s',
                    }}
                  >
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: isActive ? 'var(--accent)' : 'var(--text-3)', paddingTop: 1 }}>
                      {fmtTime(seg.startMs / 1000)}
                    </span>
                    <span style={{ wordBreak: 'break-word' }}>
                      {seg.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {manifest && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--text-3)' }}>
                <span>{manifest.host.name} × {manifest.guest.name}</span>
                <span>·</span>
                <span>~{Math.round(manifest.runtimeMs / 60000)} min</span>
                <span>·</span>
                <span>{manifest.storyTitles.length} stories</span>
              </div>
            )}
          </div>
        </div>

        {archive.length > 0 && (
          <div className="script-section">
            <div className="script-section-title">Past 14 days</div>
            <div className="stories-grid">
              {filteredArchive.map((ep) => {
                const isCurrent = ep.date === activeDate;
                const minutes = Math.round(ep.runtimeMs / 60000);
                return (
                  <button
                    key={ep.date}
                    type="button"
                    onClick={() => selectEpisode(ep)}
                    className={`story-tile${isCurrent ? ' is-current' : ''}`}
                  >
                    <div className="story-tile-thumb-wrap">
                      <div
                        className="story-tile-thumb"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,140,40,0.55), rgba(255,102,0,0.32))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: '#fff',
                          textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                        }}
                      >
                        {fmtDateShort(ep.date)}
                      </div>
                      <span className="story-tile-pip">
                        {isCurrent && <span className="story-tile-pip-dot" />}
                        {minutes}m
                      </span>
                    </div>
                    <div>
                      <div className="story-tile-title">{ep.host.name.split(' ').pop()} × {ep.guest.name.split(' ').pop()}</div>
                      <div className="story-tile-meta">
                        <span>{ep.storyTitles.length} stories</span>
                        {isCurrent && (
                          <>
                            <span className="meta-dot" />
                            <span className="meta-now">now playing</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 28, marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--text-1)', letterSpacing: '0.04em' }}>
            Next episode drops at 7:00 AM IST · 1:30 AM GMT · 6:30 PM PT (prev day)
          </span>
        </div>
      </div>

      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={(e) => setNow((e.target as HTMLAudioElement).currentTime)}
          onPlay={() => {
            setPlaying(true);
            const b = bedRef.current;
            if (b && musicOn) { b.volume = bedVol; b.play().catch(() => {}); }
          }}
          onPause={() => {
            setPlaying(false);
            bedRef.current?.pause();
          }}
          onEnded={() => {
            setPlaying(false);
            const b = bedRef.current;
            if (b) { b.pause(); b.currentTime = 0; }
          }}
        />
      )}
      <audio ref={bedRef} src="/audio/bed.mp3" loop preload="auto" />
      {showLogin && <LoginModal onLogin={(u) => { setUser(u); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
    </div>
  );
}
