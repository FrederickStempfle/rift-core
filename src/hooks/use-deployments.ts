"use client"

import useSWR from "swr"

const ACTIVE_STATUSES = new Set(["queued", "cloning", "building", "deploying"])

export type Deployment = {
  id: string
  project_id: string
  commit_sha: string
  commit_message?: string | null
  branch: string
  status: string
  build_duration_ms?: number | null
  url?: string | null
  public_url?: string | null
  started_at?: string | null
  finished_at?: string | null
  created_at: string
}

export function useDeployments(projectId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Deployment[]>(
    projectId ? `/api/deployments?project_id=${encodeURIComponent(projectId)}` : null,
    {
      refreshInterval: (latestData?: Deployment[]) => {
        if (!latestData || latestData.length === 0) return 0
        return ACTIVE_STATUSES.has(latestData[0].status) ? 3000 : 0
      },
    }
  )
  return { deployments: data ?? [], error, isLoading, mutate }
}
