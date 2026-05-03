import { Suspense } from 'react';
import { PodcastShell } from '@/components/podcast-shell';
import './podcast.css';

export const metadata = { title: 'HN++ · Daily Podcast' };

export default function PodcastPage() {
  return (
    <>
      <div className="sf-bg" aria-hidden />
      <Suspense fallback={<div className="podcast-page" />}>
        <PodcastShell />
      </Suspense>
    </>
  );
}
