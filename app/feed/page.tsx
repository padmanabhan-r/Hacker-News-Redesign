import { Suspense } from 'react';
import { FeedShell } from '@/components/feed-shell';
import './feed.css';

export const metadata = { title: 'HN++ · Hacker News Redesign' };

export default function FeedPage() {
  return (
    <>
      <div className="sf-bg" aria-hidden />
      <Suspense fallback={<div className="feed-page" />}>
        <FeedShell />
      </Suspense>
    </>
  );
}
