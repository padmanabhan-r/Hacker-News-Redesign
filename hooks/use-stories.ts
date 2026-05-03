'use client';

import useSWR from 'swr';
import type { FeedKind, HNItem, AlgoliaStory } from '@/lib/hn';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useStories(feed: FeedKind, page = 1, pageSize = 30) {
  const { data, isLoading, error, mutate } = useSWR<{
    items: HNItem[];
    totalIds: number;
    hasMore: boolean;
  }>(`/api/hn?feed=${feed}&page=${page}&pageSize=${pageSize}`, fetcher, {
    revalidateOnFocus: false,
  });
  return { items: data?.items || [], hasMore: data?.hasMore || false, isLoading, error, mutate };
}

export function useStoryThread(id: number | null) {
  const { data, isLoading, error } = useSWR<AlgoliaStory>(
    id ? `/api/hn?id=${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { thread: data, isLoading, error };
}
