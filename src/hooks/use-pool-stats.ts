"use client"

import useSWR from "swr"

export type PoolStats = {
  mode: string
  warm_workers: number
  active_workers: number
  max_workers: number
  suspended_deployments: number
}

export function usePoolStats() {
  const { data, error, isLoading } = useSWR<PoolStats>("/api/runtime/stats", {
    refreshInterval: 10000,
  })
  return { poolStats: data ?? null, error, isLoading }
}
