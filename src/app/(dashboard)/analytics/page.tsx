"use client"

import { useCallback, useEffect, useState } from "react"
import { Activity, AlertTriangle, BarChart3, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Project = {
  id: string
  name: string
}

type AnalyticsBucket = {
  bucket: string
  requests: number
  errors: number
  avg_ms: number
}

type AnalyticsData = {
  buckets: AnalyticsBucket[]
  total_requests: number
  total_errors: number
  avg_response_ms: number
  error_rate: number
}

const PERIODS = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
] as const

function formatTime(iso: string, period: string): string {
  const d = new Date(iso)
  if (period === "24h") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [period, setPeriod] = useState<string>("24h")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" })
        if (res.ok) {
          const list = (await res.json()) as Project[]
          setProjects(list)
          if (list.length > 0) setSelectedProjectId(list[0].id)
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [])

  const fetchAnalytics = useCallback(async (projectId: string, p: string) => {
    setLoadingData(true)
    try {
      const res = await fetch(
        `/api/analytics?projectId=${encodeURIComponent(projectId)}&period=${encodeURIComponent(p)}`
      )
      if (res.ok) {
        setData(await res.json())
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (selectedProjectId) fetchAnalytics(selectedProjectId, period)
  }, [selectedProjectId, period, fetchAnalytics])

  if (loading) {
    return (
      <div className="flex flex-col gap-8 p-4 sm:p-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  const maxRequests = data
    ? Math.max(...data.buckets.map((b) => b.requests), 1)
    : 1

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Request metrics for your deployments.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">No projects yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a project first to view analytics.
          </p>
        </div>
      ) : (
        <>
          {/* Project + Period Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Project</label>
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <div className="ml-auto flex rounded-md border shadow-sm">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                    period === p.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stat Cards */}
          {loadingData ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          ) : data ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border px-5 py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="size-4" />
                  <span className="text-xs font-medium">Total Requests</span>
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {data.total_requests.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border px-5 py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" />
                  <span className="text-xs font-medium">Avg Response Time</span>
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {data.avg_response_ms.toFixed(0)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">ms</span>
                </p>
              </div>
              <div className="rounded-lg border px-5 py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="size-4" />
                  <span className="text-xs font-medium">Error Rate</span>
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {data.error_rate.toFixed(1)}
                  <span className="ml-0.5 text-sm font-normal text-muted-foreground">%</span>
                </p>
              </div>
            </div>
          ) : null}

          {/* Bar Chart */}
          <section className="overflow-hidden rounded-lg border">
            <div className="border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Requests Over Time</h2>
              </div>
            </div>

            {loadingData ? (
              <div className="p-4">
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : data && data.buckets.length > 0 ? (
              <div className="p-4">
                <div className="flex items-end gap-px" style={{ height: 200 }}>
                  {data.buckets.map((bucket) => {
                    const height = (bucket.requests / maxRequests) * 100
                    const errorHeight =
                      bucket.requests > 0
                        ? (bucket.errors / maxRequests) * 100
                        : 0
                    return (
                      <div
                        key={bucket.bucket}
                        className="group relative flex-1"
                        style={{ height: "100%", minWidth: 2 }}
                      >
                        {/* Success bar */}
                        <div
                          className="absolute bottom-0 w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                          style={{ height: `${height}%` }}
                        />
                        {/* Error overlay */}
                        {errorHeight > 0 && (
                          <div
                            className="absolute bottom-0 w-full rounded-t bg-destructive/70"
                            style={{ height: `${errorHeight}%` }}
                          />
                        )}
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-xs shadow-md group-hover:block">
                          <p className="whitespace-nowrap font-medium">
                            {formatTime(bucket.bucket, period)}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {bucket.requests.toLocaleString()} requests
                          </p>
                          {bucket.errors > 0 && (
                            <p className="text-destructive">
                              {bucket.errors.toLocaleString()} errors
                            </p>
                          )}
                          <p className="text-muted-foreground">
                            {bucket.avg_ms.toFixed(0)}ms avg
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* X-axis labels */}
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>{formatTime(data.buckets[0].bucket, period)}</span>
                  {data.buckets.length > 2 && (
                    <span>
                      {formatTime(
                        data.buckets[Math.floor(data.buckets.length / 2)].bucket,
                        period
                      )}
                    </span>
                  )}
                  <span>
                    {formatTime(
                      data.buckets[data.buckets.length - 1].bucket,
                      period
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <BarChart3 className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">No data yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Analytics will appear once your deployment receives traffic.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
