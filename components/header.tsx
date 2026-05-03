'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Bell, Mic, ArrowRight, Headphones, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Brand } from './brand';
import { ThemeToggle } from './theme-toggle';
import { ConvAgent } from './conv-agent';

const NAV: { id: string; label: string; href: string }[] = [
  { id: 'top',  label: 'Top',   href: '/feed?feed=top' },
  { id: 'new',  label: 'New',   href: '/feed?feed=new' },
  { id: 'best', label: 'Best',  href: '/feed?feed=best' },
  { id: 'ask',  label: 'Ask',   href: '/feed?feed=ask' },
  { id: 'show', label: 'Show',  href: '/feed?feed=show' },
  { id: 'jobs', label: 'Jobs',  href: '/feed?feed=jobs' },
];

export function Header() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const activeFeed = params.get('feed') || 'top';
  const [q, setQ] = useState('');
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/feed?q=${encodeURIComponent(q.trim())}`);
  }

  async function toggleVoiceSearch() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const fd = new FormData();
        fd.append('audio', blob, 'q.webm');
        const r = await fetch('/api/stt', { method: 'POST', body: fd });
        if (r.ok) {
          const j = await r.json();
          if (j?.text) {
            setQ(j.text);
            router.push(`/feed?q=${encodeURIComponent(j.text)}`);
          }
        }
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
      setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, 4500);
    } catch (e) {
      console.error('mic error', e);
    }
  }

  return (
    <header className="hdr">
      <Brand size="sm" />

      <form className="search-wrap" onSubmit={submitSearch}>
        <Search size={14} className="search-ico" />
        <input
          type="search"
          className="search-input"
          placeholder="Search HN — or speak"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search Hacker News"
        />
        <button
          type="button"
          aria-label="Voice search"
          className={`search-mic ${recording ? 'recording' : ''}`}
          onClick={toggleVoiceSearch}
        >
          <Mic size={12} />
        </button>
      </form>

      <nav className="hnav">
        {NAV.map((n) => {
          const isActive = pathname === '/feed' && activeFeed === n.id;
          return (
            <Link
              key={n.id}
              href={n.href}
              className={`hnav-btn ${isActive ? 'active' : ''}`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="hdr-right">
        <Link
          href="/highlights"
          className={`hnav-btn ${pathname === '/highlights' ? 'active' : ''}`}
        >
          <Sparkles size={12} /> Highlights
        </Link>
        <Link
          href="/podcast"
          className={`hnav-btn ${pathname === '/podcast' ? 'active' : ''}`}
          style={{ color: 'var(--accent)', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}
        >
          <Headphones size={12} /> Pod
        </Link>
        <ConvAgent />
        <ThemeToggle />
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={14} />
        </button>
        <button className="submit-btn">
          Submit <ArrowRight size={11} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
