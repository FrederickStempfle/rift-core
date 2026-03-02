"use client"

import useSWR from "swr"

export type EnvVar = {
  id: string
  project_id: string
  key: string
  preview: string
}

export function useEnvVars(projectId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<EnvVar[]>(
    projectId ? `/api/env-vars?projectId=${encodeURIComponent(projectId)}` : null
  )
  return { envVars: data ?? [], error, isLoading, mutate }
}
