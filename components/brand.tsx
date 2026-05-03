'use client';

import Link from 'next/link';

export function Brand({ size = 'md', href = '/' }: { size?: 'sm' | 'md' | 'lg'; href?: string }) {
  const dim = size === 'sm' ? 22 : size === 'lg' ? 38 : 30;
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 16 : 13;
  const nameSize = size === 'sm' ? 13 : size === 'lg' ? 22 : 18;

  return (
    <Link href={href} className="flex items-center gap-2.5 no-underline">
      <div
        className="brand-mark"
        style={{ width: dim, height: dim, fontSize, borderRadius: dim * 0.23 }}
      >
        Y
      </div>
      <div className="leading-tight">
        <div
          className="font-display font-extrabold tracking-tight"
          style={{ fontSize: nameSize, color: 'var(--text-1)' }}
        >
          HN<span style={{ color: 'var(--accent)' }}>++</span>
        </div>
        {size !== 'sm' && (
          <div
            className="font-mono uppercase"
            style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.15em' }}
          >
            A Hacker News Redesign
          </div>
        )}
      </div>
    </Link>
  );
}
