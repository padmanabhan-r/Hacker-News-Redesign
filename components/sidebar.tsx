'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import {
  Flame, Clock, Star, MessageCircleQuestion, Eye, Briefcase,
  Sparkles, Headphones, Bookmark, History,
} from 'lucide-react';

const FEEDS = [
  { id: 'top',  label: 'Top',     icon: Flame },
  { id: 'new',  label: 'New',     icon: Clock },
  { id: 'best', label: 'Best',    icon: Star },
  { id: 'ask',  label: 'Ask HN',  icon: MessageCircleQuestion },
  { id: 'show', label: 'Show HN', icon: Eye },
  { id: 'jobs', label: 'Jobs',    icon: Briefcase },
];

export function Sidebar() {
  const params = useSearchParams();
  const pathname = usePathname();
  const activeFeed = params.get('feed') || 'top';

  return (
    <aside className="sidebar">
      <div className="sb-section">Feeds</div>
      {FEEDS.map((f) => {
        const isActive = pathname === '/feed' && activeFeed === f.id;
        const Icon = f.icon;
        return (
          <Link
            key={f.id}
            href={`/feed?feed=${f.id}`}
            className={`sb-btn ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} className="sb-icon" />
            <span>{f.label}</span>
          </Link>
        );
      })}

      <div className="sb-divider" />
      <div className="sb-section">Discover</div>
      <Link
        href="/highlights"
        className={`sb-btn ${pathname === '/highlights' ? 'active' : ''}`}
      >
        <Sparkles size={15} className="sb-icon" />
        <span>AI Highlights</span>
      </Link>
      <Link
        href="/podcast"
        className={`sb-btn ${pathname === '/podcast' ? 'active' : ''}`}
      >
        <Headphones size={15} className="sb-icon" />
        <span>HN Pod</span>
      </Link>

      <div className="sb-divider" />
      <div className="sb-section">You</div>
      <button className="sb-btn">
        <Bookmark size={15} className="sb-icon" />
        <span>Saved</span>
      </button>
      <button className="sb-btn">
        <History size={15} className="sb-icon" />
        <span>History</span>
      </button>
    </aside>
  );
}
