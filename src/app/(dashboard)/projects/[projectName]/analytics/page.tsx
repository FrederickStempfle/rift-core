"use client"

import { useState } from "react"
import { BarChart3 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedPage } from "@/components/animated-page"
import { useAnalytics } from "@/hooks/use-analytics"
import { useProjectContext } from "../context"

const ANALYTICS_PERIODS = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
] as const

function formatBucketTime(iso: string, period: string): string {
  const d = new Date(iso)
  if (period === "24h") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

export default function ProjectAnalyticsPage() {
  const { project } = useProjectContext()
  const [period, setPeriod] = useState("24h")
  const { analytics: analyticsData, isLoading } = useAnalytics(project?.id ?? null, period)

  if (!project) return null

  return (
    <AnimatedPage className="flex flex-col gap-6">
      {/* Period selector */}
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Request Metrics</p>
        <div className="flex gap-1">
          {ANALYTICS_PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                period === p.value
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat row */}
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : analyticsData ? (
        <div className="flex flex-wrap gap-x-8 gap-y-2 border-b pb-4">
          <div>
            <p className="text-2xl font-semibold tabular-nums">{analyticsData.total_requests.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">requests</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{analyticsData.avg_response_ms.toFixed(0)}<span className="text-sm font-normal text-muted-foreground">ms</span></p>
            <p className="text-xs text-muted-foreground">avg response</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{analyticsData.error_rate.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">%</span></p>
            <p className="text-xs text-muted-foreground">error rate</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{analyticsData.total_cold_starts.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">cold starts</p>
          </div>
        </div>
      ) : null}

      {/* Bar chart */}
      <section>
        <p className="mb-3 text-sm font-medium">Requests Over Time</p>

        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : analyticsData && analyticsData.buckets.length > 0 ? (
          <div className="p-4">
            <div className="flex items-end gap-px" style={{ height: 200 }}>
              {(() => {
                const maxReqs = Math.max(...analyticsData.buckets.map((b) => b.requests), 1)
                return analyticsData.buckets.map((bucket) => {
                  const height = (bucket.requests / maxReqs) * 100
                  const errorHeight = bucket.requests > 0 ? (bucket.errors / maxReqs) * 100 : 0
                  return (
                    <div
                      key={bucket.bucket}
                      className="group relative flex-1"
                      style={{ height: "100%", minWidth: 2 }}
                    >
                      <div
                        className="absolute bottom-0 w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                        style={{ height: `${height}%` }}
                      />
                      {errorHeight > 0 && (
                        <div
                          className="absolute bottom-0 w-full rounded-t bg-destructive/70"
                          style={{ height: `${errorHeight}%` }}
                        />
                      )}
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-xs shadow-md group-hover:block">
                        <p className="whitespace-nowrap font-medium">
                          {formatBucketTime(bucket.bucket, period)}
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
                        {bucket.cold_starts > 0 && (
                          <p className="text-muted-foreground">
                            {bucket.cold_starts.toLocaleString()} cold starts
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{formatBucketTime(analyticsData.buckets[0].bucket, period)}</span>
              {analyticsData.buckets.length > 2 && (
                <span>
                  {formatBucketTime(
                    analyticsData.buckets[Math.floor(analyticsData.buckets.length / 2)].bucket,
                    period
                  )}
                </span>
              )}
              <span>
                {formatBucketTime(
                  analyticsData.buckets[analyticsData.buckets.length - 1].bucket,
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
    </AnimatedPage>
  )
}
