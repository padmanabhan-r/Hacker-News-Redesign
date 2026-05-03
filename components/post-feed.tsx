'use client';

import { PostCard } from './post-card';
import type { HNItem } from '@/lib/hn';

export function PostFeed({ items, title }: { items: HNItem[]; title?: string }) {
  return (
    <div>
      {title && (
        <div className="feed-header">
          <h1 className="feed-title">{title}</h1>
        </div>
      )}
      {items.map((it) => (
        <PostCard key={it.id} item={it} />
      ))}
    </div>
  );
}
