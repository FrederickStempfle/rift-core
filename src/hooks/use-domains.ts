"use client"

import useSWR from "swr"

export type Domain = {
  id: string
  projectId: string | null
  serviceId: string | null
  projectName?: string | null
  serviceName?: string | null
  domain: string
  isPrimary: boolean
  verified: boolean
  sslStatus: "pending" | "provisioning" | "active" | "failed"
  targetUrl?: string | null
}

export function useDomains(projectId?: string, serviceId?: string) {
  const key = projectId
    ? `/api/domains?projectId=${encodeURIComponent(projectId)}`
    : serviceId
      ? `/api/domains?serviceId=${encodeURIComponent(serviceId)}`
      : "/api/domains"
  const { data, error, isLoading, mutate } = useSWR<Domain[]>(key)
  return { domains: data ?? [], error, isLoading, mutate }
}

export function useServerIp() {
  const { data } = useSWR<{ ip: string }>("/api/domains?serverIp=true", {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })
  return data?.ip ?? null
}
