"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/dashboard", fetcher);
  return { stats: data?.data || null, error, isLoading, mutate };
}
