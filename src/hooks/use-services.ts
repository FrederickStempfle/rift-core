"use client"

import useSWR from "swr"

export type ServiceConnectionInfo = {
  api_url?: string
  studio_url?: string
  internal_api_url?: string
  internal_studio_url?: string
  db_connection_string?: string
  anon_key?: string
  service_role_key?: string
}

export type Service = {
  id: string
  service_type: string
  name: string
  status: string
  connection_info: ServiceConnectionInfo | null
  error_message: string | null
  started_at: string | null
  stopped_at: string | null
  created_at: string
  updated_at: string
}

export function useServices() {
  const { data, error, isLoading, mutate } = useSWR<Service[]>("/api/services", {
    refreshInterval: 5000,
  })
  return {
    services: data ?? [],
    error: error ? (error instanceof Error ? error.message : "Failed to load services") : null,
    isLoading,
    mutate,
  }
}

export function useService(id: string | null) {
  const { services, error, isLoading, mutate } = useServices()
  const service = id ? (services.find((s) => s.id === id) ?? null) : null
  return { service, error, isLoading, mutate }
}
