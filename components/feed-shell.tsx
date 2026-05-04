'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useStories, useStoryThread } from '@/hooks/use-stories';
import {
  categorize, parseDomain, timeAgo, getLinkPreview, getFavicon, gradientForCat,
  type FeedKind, type HNItem, type AlgoliaComment,
} from '@/lib/hn';
import { generateThumbnail } from '@/lib/thumbnail';
import { LoginModal, UserChip, getStoredUser, clearStoredUser, type HNUser } from '@/components/login-modal';
import { TalkBotButton } from './talk-bot-button';
import { SubmitButton } from './submit-button';

const Ico = {
  Home: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  New: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,15"/></svg>,
  Ask: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  Show: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Jobs: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  Save: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
  Bell: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Plus: () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Up: () => <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><polygon points="5,1 9,9 1,9"/></svg>,
  Msg: () => <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  Ext: () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  ChevL: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6"/></svg>,
  Search: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Star: () => <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>,
  Play: () => <svg width="9" height="9" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>,
  Pause: () => <svg width="9" height="9" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  SkipF: () => <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" fill="none"/></svg>,
  Mic: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Sun: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  X: () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Spin: () => <svg className="hn-spinner" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>,
};

const NAV = [
  { id: 'top', label: 'Top', icon: <Ico.Home /> },
  { id: 'new', label: 'New', icon: <Ico.New /> },
  { id: 'past', label: 'Past', icon: <Ico.Save /> },
  { id: 'comments', label: 'Comments', icon: <Ico.Ask /> },
  { id: 'ask', label: 'Ask', icon: <Ico.Ask /> },
  { id: 'show', label: 'Show', icon: <Ico.Show /> },
  { id: 'jobs', label: 'Jobs', icon: <Ico.Jobs /> },
] as const;

const FEED_TITLES: Record<string, string> = {
  top: 'Top Stories', new: 'New', best: 'Best',
  past: 'Past', comments: 'Comments',
  ask: 'Ask HN', show: 'Show HN', jobs: 'Jobs',
};

const CODE_RAIN = `function fetchTopStories(){
  const res = await fetch(HN+'/topstories.json');
  return Promise.all(res.slice(0,30).map(getItem));
}

impl Iterator for HackerNews {
  type Item = Story;
  fn next(&mut self) -> Option<Story> {
    self.cursor += 1;
    self.feed.get(self.cursor).cloned()
  }
}

$ curl -s news.ycombinator.com | grep -oP 'titleline'
$ ssh -i ~/.ssh/id_ed25519 hn@dev.local
$ docker run -d --name pg -p 5432:5432 postgres:16

SELECT s.id, s.title, COUNT(c.id) AS comments
FROM stories s LEFT JOIN comments c ON c.story_id = s.id
GROUP BY s.id ORDER BY s.score DESC LIMIT 30;

>>> import torch.nn as nn
>>> model = nn.Transformer(d_model=512)
>>> y = model(src, tgt)

01101000 01100001 01100011 01101011 01100101 01110010

[INFO] cargo build --release
[ OK ] compiled hn-cli v0.4.2 in 1.84s
[INFO] connecting to firebaseio.com:443
[ OK ] streaming 30 items

# why? because Hacker News deserves better.
`.repeat(3);

function StoryCard({ story, onOpen, voted, onVote, onListen, audioStoryId, audioPlaying, audioLoading, audioMsg }: {
  story: HNItem; onOpen: (s: HNItem) => void; voted: boolean;
  onVote: (id: number) => void; onListen: (s: HNItem) => void;
  audioStoryId?: number; audioPlaying?: boolean; audioLoading?: boolean; audioMsg?: string;
}) {
  const realThumb = getLinkPreview(story);
  const fav = getFavicon(story.url, 64);
  const dom = parseDomain(story.url);
  const isCurrent = audioStoryId === story.id;
  const isLoading = isCurrent && !!audioLoading;
  const isPlaying = isCurrent && !!audioPlaying;
  const cat = categorize(story.title);
  // Always have a thumbnail: canvas is the base, Microlink upgrades it on success.
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    setThumb(generateThumbnail(story));
    if (!realThumb) return;
    const img = new Image();
    img.onload = () => setThumb(realThumb);
    img.src = realThumb;
  }, [story.id, realThumb]);
  const showThumb = thumb;

  return (
    <article className="story-card" onClick={() => onOpen(story)}>
      <div
        className="story-thumb"
        style={{
          backgroundImage: showThumb ? `url(${showThumb})` : gradientForCat(cat),
        }}
        onClick={(e) => { e.stopPropagation(); onListen(story); }}
      >
        {fav && <img className="story-thumb-fav" src={fav} alt="" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />}
        <div className="story-thumb-play">
          <div className="play-icon-sm">{isLoading ? <Ico.Spin /> : isPlaying ? <Ico.Pause /> : <Ico.Play />}</div>
        </div>
      </div>
      <div className="vote-col">
        <button type="button" className={`vote-up${voted ? ' active' : ''}`} onClick={(e) => { e.stopPropagation(); onVote(story.id); }}>
          <Ico.Up />
        </button>
        <span className="vote-score">{story.score ?? 0}</span>
      </div>
      <div className="story-body">
        <div className="story-title">{story.title}</div>
        {dom && <div className="story-domain">{dom}</div>}
        <div className="story-meta-row">
          <span className="meta-item"><Ico.Star /> {story.score ?? 0}</span>
          <span className="meta-item">by {story.by}</span>
          <span className="meta-item">{timeAgo(story.time)}</span>
        </div>
      </div>
      <div className="story-actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cmts-btn" onClick={() => onOpen(story)}><Ico.Msg /> {story.descendants ?? 0}</button>
        <button type="button" className={`audio-btn${isPlaying ? ' playing' : ''}${isLoading ? ' loading' : ''}`} onClick={() => onListen(story)} disabled={isLoading}>
          {isLoading ? <Ico.Spin /> : isPlaying ? <Ico.Pause /> : <Ico.Play />}
          {isLoading ? (audioMsg || 'Fetching…') : isPlaying ? 'Playing' : 'Listen'}
        </button>
      </div>
    </article>
  );
}

function CommentCard({ item }: { item: HNItem }) {
  const raw = item.text ?? '';
  const text = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const preview = text.length > 280 ? text.slice(0, 280) + '…' : text;
  return (
    <article className="comment-card">
      <div className="cc-meta">
        <span className="cc-author">{item.by}</span>
        <span className="cc-sep">·</span>
        <span className="cc-time">{timeAgo(item.time)}</span>
      </div>
      <div className="cc-text">{preview}</div>
      {item.title && item.url && (
        <Link
          className="cc-story"
          href={item.url}
          onClick={(e) => e.stopPropagation()}
        >
          on: {item.title}
        </Link>
      )}
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="story-card" style={{ pointerEvents: 'none', marginBottom: 4 }}>
      <div className="sk" style={{ width: 84, height: 64, borderRadius: 9, flexShrink: 0 }} />
      <div style={{ width: 26 }} />
      <div style={{ flex: 1 }}>
        <div className="sk" style={{ height: 12, marginBottom: 7, width: '78%' }} />
        <div className="sk" style={{ height: 8, marginBottom: 6, width: 80 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="sk" style={{ height: 8, width: 45 }} />
          <div className="sk" style={{ height: 8, width: 55 }} />
        </div>
      </div>
    </div>
  );
}

function CommentNode({ node, depth = 0 }: { node: AlgoliaComment; depth?: number }) {
  const [open, setOpen] = useState(true);
  if (!node) return null;
  const cls = depth === 0 ? 'comment-block' : depth === 1 ? 'comment-block d1' : 'comment-block d2';
  const kids = (node.children || []).slice(0, depth < 2 ? 4 : 0);
  return (
    <div>
      <div className={cls}>
        <div className="comment-hdr">
          <span className="comment-author">{node.author || 'anon'}</span>
          <span className="comment-time">{timeAgo(node.created_at_i)}</span>
          <button type="button" className="collapse-tog" onClick={() => setOpen((o) => !o)}>{open ? '[–]' : '[+]'}</button>
        </div>
        {open && (
          <>
            <div className="comment-text" dangerouslySetInnerHTML={{ __html: node.text || '<em style="opacity:.4">deleted</em>' }} />
            <div className="comment-acts">
              <span className="comment-act"><Ico.Up /> upvote</span>
              <span className="comment-act"><Ico.Msg /> reply</span>
            </div>
          </>
        )}
      </div>
      {open && kids.map((c) => <CommentNode key={c.id} node={c} depth={Math.min(depth + 1, 2)} />)}
    </div>
  );
}

function DetailView({ story, onBack, onListen, audioStoryId, audioPlaying, audioLoading, audioMsg }: {
  story: HNItem; onBack: () => void; onListen: (s: HNItem) => void;
  audioStoryId?: number; audioPlaying?: boolean; audioLoading?: boolean; audioMsg?: string;
}) {
  const { thread, isLoading } = useStoryThread(story.id);
  const realThumb = getLinkPreview(story);
  const cat = categorize(story.title);
  const isCurrent = audioStoryId === story.id;
  const isAudioLoading = isCurrent && !!audioLoading;
  const isPlaying = isCurrent && !!audioPlaying;
  // Always have a hero image: canvas first, Microlink upgrades.
  const [hero, setHero] = useState<string | null>(null);
  useEffect(() => {
    setHero(generateThumbnail(story, 1200, 480));
    if (!realThumb) return;
    const img = new Image();
    img.onload = () => setHero(realThumb);
    img.src = realThumb;
  }, [story.id, realThumb]);

  return (
    <div className="detail-wrap">
      <button type="button" className="back-pill" onClick={onBack}><Ico.ChevL /> Back to feed</button>
      <div
        className="detail-hero"
        style={{
          backgroundImage: hero ? `url(${hero})` : `linear-gradient(135deg, ${cat.color}66, ${cat.color}22)`,
        }}
      >
        <div className="detail-hero-overlay" />
        <span className="detail-hero-badge">{cat.label}</span>
      </div>
      <h1 className="detail-title-text">{story.title}</h1>
      <div className="detail-meta-bar">
        {parseDomain(story.url) && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent-text)' }}>{parseDomain(story.url)}</span>}
        <span className="detail-meta-item"><Ico.Star /> {story.score ?? 0} pts</span>
        <span className="detail-meta-item">by {story.by}</span>
        <span className="detail-meta-item">{timeAgo(story.time)}</span>
        <span className="detail-meta-item"><Ico.Msg /> {story.descendants ?? 0}</span>
      </div>
      <div className="detail-actions">
        {story.url && <a className="visit-btn" href={story.url} target="_blank" rel="noopener">Visit site <Ico.Ext /></a>}
        <button type="button" className={`listen-btn${isPlaying ? ' active' : ''}${isAudioLoading ? ' loading' : ''}`} onClick={() => onListen(story)} disabled={isAudioLoading}>
          {isAudioLoading ? <><Ico.Spin /> {audioMsg || 'Fetching…'}</> : isPlaying ? <><Ico.Pause /> Playing…</> : <><Ico.Play /> Listen to story</>}
        </button>
      </div>
      <div className="comments-divider" />
      <div className="comments-hdr">
        <span className="comments-hdr-lbl">Discussion</span>
        <span className="comments-badge">{story.descendants ?? 0}</span>
      </div>
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="comment-block" style={{ marginBottom: 4 }}>
              <div className="sk" style={{ height: 9, width: 100, marginBottom: 8 }} />
              <div className="sk" style={{ height: 9, width: '85%', marginBottom: 5 }} />
              <div className="sk" style={{ height: 9, width: '70%' }} />
            </div>
          ))
        : thread?.children?.length
          ? thread.children.slice(0, 20).map((c) => <CommentNode key={c.id} node={c} depth={0} />)
          : <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '10px 0' }}>No comments yet.</p>}
    </div>
  );
}

function AudioBar({ story, playing, loading, msg, onPlayPause, onClose, progress }: {
  story: HNItem; playing: boolean; loading: boolean; msg?: string; onPlayPause: () => void; onClose: () => void; progress: number;
}) {
  const thumb = getLinkPreview(story);
  const pct = Math.min(100, Math.max(0, progress * 100));
  return (
    <div className="audio-player-bar">
      <div className="ap-thumb" style={{ backgroundImage: thumb ? `url(${thumb})` : undefined }} />
      <div className="ap-info">
        <div className="ap-title">{story.title}</div>
        <div className="ap-sub">{loading ? (msg || 'Fetching…') : `Story audio · ${story.by}`}</div>
      </div>
      <div className="ap-controls">
        <button type="button" className="ap-skip"><Ico.ChevL /></button>
        <button type="button" className="ap-play-btn" onClick={onPlayPause} disabled={loading}>
          {loading ? <Ico.Spin /> : playing ? <Ico.Pause /> : <Ico.Play />}
        </button>
        <button type="button" className="ap-skip"><Ico.SkipF /></button>
      </div>
      <div className="ap-progress-wrap">
        <div className="ap-progress-track"><div className="ap-progress-fill" style={{ width: `${pct}%` }} /></div>
      </div>
      <span className="ap-time">{Math.round(pct)}%</span>
      <button type="button" className="ap-close" onClick={onClose}><Ico.X /></button>
    </div>
  );
}

function shiftDay(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function shiftMonth(ymd: string, months: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function shiftYear(ymd: string, years: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function PastNav({ day, router }: { day: string; router: ReturnType<typeof import('next/navigation').useRouter> }) {
  const todayYmd = new Date().toISOString().slice(0, 10);
  const label = new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const nav = (d: string) => router.push(`/feed?feed=past&day=${d}`);
  const canFwdDay = shiftDay(day, 1) <= todayYmd;
  const canFwdMonth = shiftMonth(day, 1) <= todayYmd;
  const canFwdYear = shiftYear(day, 1) <= todayYmd;
  return (
    <div className="past-nav">
      <span className="past-nav-label">Stories from {label} (UTC)</span>
      <div className="past-nav-links">
        <button type="button" onClick={() => nav(shiftDay(day, -1))}>← day</button>
        <button type="button" onClick={() => nav(shiftMonth(day, -1))}>← month</button>
        <button type="button" onClick={() => nav(shiftYear(day, -1))}>← year</button>
        {canFwdDay && <button type="button" onClick={() => nav(shiftDay(day, 1))}>day →</button>}
        {canFwdMonth && <button type="button" onClick={() => nav(shiftMonth(day, 1))}>month →</button>}
        {canFwdYear && <button type="button" onClick={() => nav(shiftYear(day, 1))}>year →</button>}
      </div>
    </div>
  );
}

export function FeedShell() {
  const params = useSearchParams();
  const router = useRouter();
  const activeNav = (params.get('feed') || 'top') as FeedKind;
  const id = params.get('id');
  const search = params.get('q') || '';
  const dayParam = params.get('day') || undefined;
  const [page, setPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | 'week' | 'month'>('all');
  const pageSize = page * 30;
  const sinceTs = timeFilter === '24h' ? Math.floor(Date.now() / 1000) - 86400
    : timeFilter === 'week' ? Math.floor(Date.now() / 1000) - 604800
    : timeFilter === 'month' ? Math.floor(Date.now() / 1000) - 2592000
    : undefined;
  const { items, isLoading, hasMore, day: resolvedDay } = useStories(activeNav, 1, pageSize, sinceTs, dayParam);
  const [voted, setVoted] = useState<Record<number, boolean>>({});
  const [searchInput, setSearchInput] = useState(search);
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

  const filtered = useMemo(() => {
    if (!searchInput) return items;
    return items.filter((s) => s.title?.toLowerCase().includes(searchInput.toLowerCase()));
  }, [items, searchInput]);

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

  function open(story: HNItem) { router.push(`/feed?feed=${activeNav}&id=${story.id}`); }
  function back() { router.push(`/feed?feed=${activeNav}`); }

  const openStory = id ? items.find((s) => String(s.id) === id) : null;
  const feedTitle = FEED_TITLES[activeNav] || 'Stories';

  return (
    <div className="feed-page">
      {/* Background layers */}
      <div className="bg-layers" aria-hidden>
        <div className="bg-code-feed">{CODE_RAIN}</div>
        <div className="bg-prompt">~/hacker-news $ tail -f stories.log<span className="bg-prompt-blink" /></div>
      </div>

      <div className="feed-page-root">
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
            <button type="button" className="hnav-btn active">Feed</button>
            <Link className="hnav-btn" href="/podcast"><Ico.Mic /> Podcast</Link>
          </nav>
          <div className="search-wrap">
            <span className="search-ico"><Ico.Search /></span>
            <input
              className="search-input"
              placeholder="Search stories…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <span className="search-kbd">⌘K</span>
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

        <div className="app-body">
          <nav className="sidebar">
            <div className="sb-section">Navigate</div>
            {NAV.map((n) => (
              <Link
                key={n.id}
                href={`/feed?feed=${n.id}`}
                className={`sb-btn${activeNav === n.id ? ' active' : ''}`}
              >
                <span className="sb-icon">{n.icon}</span>
                {n.label}
              </Link>
            ))}
            <div className="sb-divider" />
            <div className="sb-section">Filter</div>
            {([['Live feed', 'all'], ['Past 24h', '24h'], ['Past week', 'week'], ['Past month', 'month']] as const).map(([label, val]) => (
              <div key={val} className={`filter-row${timeFilter === val ? ' active' : ''}`} onClick={() => setTimeFilter(val)} style={{ cursor: 'pointer' }}>
                <div className="filter-pip" />
                {label}
              </div>
            ))}
            <div className="sb-divider" />
            <div className="sb-section">Info</div>
            {['About', 'Guidelines', 'FAQ', 'API', 'Security', 'Legal'].map((l) => (
              <button key={l} type="button" className="sb-btn" style={{ height: 28, fontSize: 11.5, color: 'var(--text-2)' }}>{l}</button>
            ))}
          </nav>

          {openStory ? (
            <DetailView
              story={openStory}
              onBack={back}
              onListen={handleListen}
              audioStoryId={audioStory?.id}
              audioPlaying={audioPlaying}
              audioLoading={audioLoading}
              audioMsg={audioMsg}
            />
          ) : (
            <main className="feed-wrap">
              <div className="feed-header">
                <h1 className="feed-title">{feedTitle}</h1>
              </div>
              {activeNav === 'past' && resolvedDay && <PastNav day={resolvedDay} router={router} />}

              {isLoading && !items.length ? (
                Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-title">Nothing here yet</div>
                  <div className="empty-sub">No stories matched.</div>
                </div>
              ) : (
                <>
                  {filtered.map((s) => activeNav === 'comments' ? (
                    <CommentCard key={s.id} item={s} />
                  ) : (
                    <StoryCard
                      key={s.id}
                      story={s}
                      onOpen={open}
                      voted={!!voted[s.id]}
                      onVote={(id) => setVoted((v) => ({ ...v, [id]: !v[id] }))}
                      onListen={handleListen}
                      audioStoryId={audioStory?.id}
                      audioPlaying={audioPlaying}
                      audioLoading={audioLoading}
                      audioMsg={audioMsg}
                    />
                  ))}
                  {hasMore && (
                    <button type="button" className="more-btn" disabled={isLoading} onClick={() => setPage((p) => p + 1)}>
                      {isLoading ? 'Loading…' : 'More'}
                    </button>
                  )}
                </>
              )}
            </main>
          )}
        </div>

        {audioStory && (
          <AudioBar
            story={audioStory}
            playing={audioPlaying}
            loading={audioLoading}
            msg={audioMsg}
            onPlayPause={() => handleListen(audioStory)}
            onClose={() => { stopAudio(); setAudioStory(null); }}
            progress={audioProgress}
          />
        )}
      </div>
      {showLogin && <LoginModal onLogin={(u) => { setUser(u); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
    </div>
  );
}
