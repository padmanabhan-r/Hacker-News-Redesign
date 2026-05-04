import { Suspense } from 'react';
import { HighlightsShell } from '@/components/highlights-shell';
import './highlights.css';

export const metadata = { title: 'HN++ · Highlights' };

export default function HighlightsPage() {
  return (
    <>
      <div className="pt-cover" aria-hidden><div className="pt-mark"><div className="pt-ring" /><div className="pt-logo">HN<span style={{color:'var(--accent)'}}>++</span></div></div></div>
      <div className="sf-bg" aria-hidden />
      <div className="aurora" aria-hidden />
      <Suspense fallback={<div className="highlights-page" />}>
        <HighlightsShell />
      </Suspense>
    </>
  );
}
