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
    onSuccess: (d) => console.log("[pool-stats] swr success:", JSON.stringify(d)),
    onError: (e) => console.error("[pool-stats] swr error:", e),
  })
  console.log("[pool-stats] swr state — isLoading:", isLoading, "data:", JSON.stringify(data), "error:", error)
  return { poolStats: data ?? null, error, isLoading }
}
