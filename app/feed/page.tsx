import { Suspense } from 'react';
import { FeedShell } from '@/components/feed-shell';
import './feed.css';

export const metadata = { title: 'HN++ · Hacker News Redesign' };

export default function FeedPage() {
  return (
    <>
      <div className="pt-cover" aria-hidden><div className="pt-mark"><div className="pt-ring" /><div className="pt-logo">HN<span style={{color:'var(--accent)'}}>++</span></div></div></div>
      <div className="sf-bg" aria-hidden />
      <Suspense fallback={<div className="feed-page" />}>
        <FeedShell />
      </Suspense>
    </>
  );
}
