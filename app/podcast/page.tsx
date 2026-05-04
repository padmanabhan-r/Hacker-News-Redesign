import { Suspense } from 'react';
import { PodcastShell } from '@/components/podcast-shell';
import './podcast.css';

export const metadata = { title: 'HN++ · Daily Podcast' };
export const revalidate = 300;

export default function PodcastPage() {
  return (
    <>
      <div className="pt-cover" aria-hidden><div className="pt-mark"><div className="pt-ring" /><div className="pt-logo">HN<span style={{color:'var(--accent)'}}>++</span></div></div></div>
      <div className="sf-bg" aria-hidden />
      <Suspense fallback={<div className="podcast-page" />}>
        <PodcastShell />
      </Suspense>
    </>
  );
}
