import { Suspense } from 'react';
import { HighlightsShell } from '@/components/highlights-shell';
import './highlights.css';

export const metadata = { title: 'HN++ · Highlights' };

export default function HighlightsPage() {
  return (
    <>
      <div className="sf-bg" aria-hidden />
      <div className="aurora" aria-hidden />
      <Suspense fallback={<div className="highlights-page" />}>
        <HighlightsShell />
      </Suspense>
    </>
  );
}
