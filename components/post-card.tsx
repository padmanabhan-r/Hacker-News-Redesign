'use client';

import Link from 'next/link';
import { ChevronUp, MessageSquare, ExternalLink } from 'lucide-react';
import type { HNItem } from '@/lib/hn';
import { categorize, parseDomain, timeAgo, getFavicon, CAT_EMOJI } from '@/lib/hn';
import { ListenButton } from './listen-button';

export function PostCard({ item }: { item: HNItem }) {
  const cat = categorize(item.title);
  const domain = parseDomain(item.url);
  const fav = getFavicon(item.url);
  const detailHref = `/feed?id=${item.id}`;
  const linkHref = item.url || `https://news.ycombinator.com/item?id=${item.id}`;

  return (
    <Link href={detailHref} className="story-card">
      <div
        className="story-thumb"
        style={{
          backgroundImage: fav ? `url(${fav})` : undefined,
          backgroundSize: '40%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          background: fav
            ? `var(--bg-alt) url(${fav}) center/40% no-repeat`
            : `linear-gradient(135deg, ${cat.color}33, ${cat.color}11)`,
        }}
      >
        {!fav && (
          <div className="flex items-center justify-center h-full text-2xl">
            {CAT_EMOJI[cat.label] || '💡'}
          </div>
        )}
      </div>

      <div className="vote-col">
        <button
          type="button"
          className="vote-up"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          aria-label="Upvote"
        >
          <ChevronUp size={12} />
        </button>
        <span className="vote-score">{(item.score || 0).toLocaleString()}</span>
      </div>

      <div className="story-body">
        <div className="story-title">{item.title}</div>
        {domain && <div className="story-domain">{domain}</div>}
        <div className="story-meta-row">
          <span className="meta-item">
            <span style={{ color: cat.color, opacity: 0.8 }}>●</span>
            {cat.label}
          </span>
          <span className="meta-item">by {item.by}</span>
          <span className="meta-item">{timeAgo(item.time)}</span>
        </div>
      </div>

      <div className="story-actions">
        <ListenButton storyId={item.id} text={item.title ?? ""} />
        <a
          href={linkHref}
          target="_blank"
          rel="noopener"
          className="cmts-btn"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={10} /> visit
        </a>
        <span className="cmts-btn">
          <MessageSquare size={10} /> {item.descendants ?? 0}
        </span>
      </div>
    </Link>
  );
}
