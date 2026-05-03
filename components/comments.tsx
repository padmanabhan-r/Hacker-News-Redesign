'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AlgoliaComment } from '@/lib/hn';
import { timeAgo } from '@/lib/hn';

function CommentBlock({ c, depth = 0 }: { c: AlgoliaComment; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasKids = (c.children?.length ?? 0) > 0;
  const margin = Math.min(depth * 18, 60);

  return (
    <div style={{ marginLeft: margin }}>
      <div className="comment-block">
        <div className="comment-hdr">
          <span className="comment-author">{c.author || '[deleted]'}</span>
          <span className="comment-time">{timeAgo(c.created_at_i)}</span>
          {hasKids && (
            <button
              type="button"
              className="collapse-tog"
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? `+ ${c.children.length}` : '−'}
            </button>
          )}
        </div>
        {!collapsed && c.text && (
          <div className="comment-text" dangerouslySetInnerHTML={{ __html: c.text }} />
        )}
      </div>
      {!collapsed && hasKids && c.children.map((k) => (
        <CommentBlock key={k.id} c={k} depth={depth + 1} />
      ))}
    </div>
  );
}

export function CommentsThread({ comments }: { comments: AlgoliaComment[] }) {
  return (
    <div>
      {comments.map((c) => (
        <CommentBlock key={c.id} c={c} depth={0} />
      ))}
    </div>
  );
}
