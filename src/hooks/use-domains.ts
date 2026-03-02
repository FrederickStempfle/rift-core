"use client"

import useSWR from "swr"

export type Domain = {
  id: string
  projectId: string | null
  projectName?: string | null
  domain: string
  isPrimary: boolean
  verified: boolean
  sslStatus: "pending" | "provisioning" | "active" | "failed"
}

export function useDomains(projectId?: string) {
  const key = projectId
    ? `/api/domains?projectId=${encodeURIComponent(projectId)}`
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
