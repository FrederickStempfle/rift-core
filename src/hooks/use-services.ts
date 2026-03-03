"use client"

import useSWR from "swr"

const ACTIVE_STATUSES = new Set(["pending", "deploying", "removing"])

export type Service = {
  id: string
  service_type: string
  name: string
  status: string
  connection_info: {
    api_url?: string
    anon_key?: string
    service_role_key?: string
    db_connection_string?: string
    studio_url?: string
  } | null
  error_message: string | null
  started_at: string | null
  stopped_at: string | null
  created_at: string
  updated_at: string
}

export function useServices() {
  const { data, error, isLoading, mutate } = useSWR<Service[]>("/api/services", {
    refreshInterval: (latestData?: Service[]) => {
      if (!latestData || latestData.length === 0) return 0
      return latestData.some((s) => ACTIVE_STATUSES.has(s.status)) ? 3000 : 0
    },
  })
  return {
    services: data ?? [],
    error: error ? (error instanceof Error ? error.message : "Failed to load services") : null,
    isLoading,
    mutate,
  }
}

export function useService(serviceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Service>(
    serviceId ? `/api/services/${serviceId}` : null,
    {
      refreshInterval: (latestData?: Service) => {
        if (!latestData) return 0
        return ACTIVE_STATUSES.has(latestData.status) ? 3000 : 0
      },
    }
  )
  return {
    service: data ?? null,
    error: error ? (error instanceof Error ? error.message : "Failed to load service") : null,
    isLoading,
    mutate,
  }
}
