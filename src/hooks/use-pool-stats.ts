"use client"

import useSWR from "swr"

export type PoolStats = {
  mode: string
  pool: {
    warm_workers: number
    active_workers: number
    max_active: number
    warm_target: number
    suspended_deployments: number
  } | null
}

export function usePoolStats() {
  const { data, error, isLoading } = useSWR<PoolStats>("/api/runtime/stats", {
    refreshInterval: 10000,
    shouldRetryOnError: false,
  })
  return { poolStats: data ?? null, error, isLoading }
}
