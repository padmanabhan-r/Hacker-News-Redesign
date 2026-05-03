'use client';

import useSWR from 'swr';
import type { FeedKind, HNItem, AlgoliaStory } from '@/lib/hn';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useStories(feed: FeedKind, page = 1, pageSize = 30, since?: number, day?: string) {
  const url = since
    ? `/api/hn?since=${since}&pageSize=${pageSize}`
    : day
    ? `/api/hn?feed=${feed}&day=${day}&pageSize=${pageSize}`
    : `/api/hn?feed=${feed}&page=${page}&pageSize=${pageSize}`;
  const { data, isLoading, error, mutate } = useSWR<{
    items: HNItem[];
    totalIds: number;
    hasMore: boolean;
    day?: string;
  }>(url, fetcher, { revalidateOnFocus: false });
  return { items: data?.items || [], hasMore: data?.hasMore || false, day: data?.day, isLoading, error, mutate };
}

export function useStoryThread(id: number | null) {
  const { data, isLoading, error } = useSWR<AlgoliaStory>(
    id ? `/api/hn?id=${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { thread: data, isLoading, error };
}
