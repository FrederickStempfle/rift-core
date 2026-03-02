"use client"

import useSWR from "swr"

export type RuntimeStatus = {
  status: "active" | "suspended" | "stopped"
  deployment_id: string | null
  url: string | null
  runtime_mode: string
}

export type RuntimeStats = {
  mode: string
  pool: {
    warm_workers: number
    active_workers: number
    suspended_deployments: number
    max_active: number
    warm_target: number
  } | null
}

export function useRuntimeStatus(projectId: string | null) {
  const { data, error, isLoading } = useSWR<RuntimeStatus>(
    projectId ? `/api/runtime/project?projectId=${encodeURIComponent(projectId)}` : null
  )
  return { runtimeStatus: data ?? null, error, isLoading }
}

export function useRuntimeStats() {
  const { data, error, isLoading } = useSWR<RuntimeStats>("/api/runtime/stats")
  return { runtimeStats: data ?? null, error, isLoading }
}
