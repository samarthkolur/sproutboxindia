"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export function useGrowerTasks() {
  const { data, error, isLoading, mutate } = useSWR("/api/grower/tasks", fetcher);
  return { tasks: data?.data || [], error, isLoading, mutate };
}
