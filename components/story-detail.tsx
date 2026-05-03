'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, MessageSquare, ThumbsUp, Clock } from 'lucide-react';
import type { AlgoliaStory } from '@/lib/hn';
import { categorize, parseDomain, timeAgo } from '@/lib/hn';
import { CommentsThread } from './comments';
import { ListenButton } from './listen-button';

export function StoryDetail({ thread }: { thread: AlgoliaStory }) {
  const cat = categorize(thread.title);
  const domain = parseDomain(thread.url);

  return (
    <>
      <Link href="/feed" className="back-pill">
        <ArrowLeft size={12} /> Back to feed
      </Link>

      {/* Hero */}
      <div
        className="detail-hero"
        style={{
          background: `linear-gradient(135deg, ${cat.color}88, ${cat.color}33), var(--bg-alt)`,
        }}
      >
        <div className="detail-hero-overlay" />
        <div className="detail-hero-badge">
          <span style={{ color: cat.color }}>●</span> {cat.label}
        </div>
      </div>

      <h1 className="detail-title-text">{thread.title}</h1>

      <div className="detail-meta-bar">
        <span className="detail-meta-item">
          <ThumbsUp size={11} /> {thread.points} points
        </span>
        <span className="detail-meta-item">by {thread.author}</span>
        <span className="detail-meta-item">
          <Clock size={11} /> {timeAgo(thread.created_at_i)}
        </span>
        {domain && <span className="detail-meta-item">{domain}</span>}
        <span className="detail-meta-item">
          <MessageSquare size={11} /> {thread.num_comments}
        </span>
      </div>

      <div className="detail-actions">
        {thread.url && (
          <a className="visit-btn" href={thread.url} target="_blank" rel="noopener">
            <ExternalLink size={12} /> Visit article
          </a>
        )}
        <Link
          className="visit-btn"
          href={`https://news.ycombinator.com/item?id=${thread.id}`}
          target="_blank"
        >
          <ExternalLink size={12} /> View on HN
        </Link>
        <ListenButton storyId={thread.id} text={thread.title + (thread.text ? '. ' + thread.text.replace(/<[^>]+>/g, '') : '')} />
      </div>

      {thread.text && (
        <div
          className="comment-text"
          style={{ marginBottom: 22 }}
          dangerouslySetInnerHTML={{ __html: thread.text }}
        />
      )}

      <div className="comments-divider" />
      <div className="comments-hdr">
        <span className="comments-hdr-lbl">Discussion</span>
        <span className="comments-badge">{thread.num_comments}</span>
      </div>
      <CommentsThread comments={thread.children || []} />
    </>
  );
}
