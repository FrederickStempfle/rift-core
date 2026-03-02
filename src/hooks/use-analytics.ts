"use client"

import useSWR from "swr"

export type AnalyticsBucket = {
  bucket: string
  requests: number
  errors: number
  avg_ms: number
  cold_starts: number
}

export type AnalyticsData = {
  buckets: AnalyticsBucket[]
  total_requests: number
  total_errors: number
  avg_response_ms: number
  error_rate: number
  total_cold_starts: number
}

export function useAnalytics(projectId: string | null, period: string) {
  const { data, error, isLoading } = useSWR<AnalyticsData>(
    projectId
      ? `/api/analytics?projectId=${encodeURIComponent(projectId)}&period=${encodeURIComponent(period)}`
      : null
  )
  return { analytics: data ?? null, error, isLoading }
}
