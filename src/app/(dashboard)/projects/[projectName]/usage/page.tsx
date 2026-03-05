"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedPage } from "@/components/animated-page"
import { useRuntimeStatus, useRuntimeStats } from "@/hooks/use-runtime-status"
import { useProjectContext, statusBadgeClasses, timeAgo } from "../context"

export default function ProjectUsagePage() {
  const { project, deployments } = useProjectContext()
  const { runtimeStatus, isLoading } = useRuntimeStatus(project?.id ?? null)
  const { runtimeStats } = useRuntimeStats()

  if (!project) return null

  return (
    <AnimatedPage className="flex flex-col gap-6">
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Runtime status */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 border-b pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${
                  runtimeStatus?.status === "active" ? "bg-emerald-500" :
                  runtimeStatus?.status === "suspended" ? "bg-amber-500" : "bg-zinc-400"
                }`} />
                <p className="text-lg font-semibold capitalize">{runtimeStatus?.status ?? "Unknown"}</p>
              </div>
              <p className="text-xs text-muted-foreground">runtime status</p>
            </div>
            <div>
              <p className="text-lg font-semibold capitalize">{runtimeStatus?.runtime_mode ?? "process"}</p>
              <p className="text-xs text-muted-foreground">
                {runtimeStatus?.runtime_mode === "pool" ? "pre-warmed pool" : "dedicated subprocess"}
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold font-mono">
                {runtimeStatus?.deployment_id ? runtimeStatus.deployment_id.slice(0, 8) : "\u2014"}
              </p>
              <p className="text-xs text-muted-foreground">active deployment</p>
            </div>
          </div>

          {/* Pool stats */}
          {runtimeStats?.pool && (
            <div>
              <p className="mb-3 text-sm font-medium">Worker Pool</p>
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {runtimeStats.pool.warm_workers}<span className="text-sm font-normal text-muted-foreground">/{runtimeStats.pool.warm_target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">warm workers</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {runtimeStats.pool.active_workers}<span className="text-sm font-normal text-muted-foreground">/{runtimeStats.pool.max_active}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">active workers</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{runtimeStats.pool.suspended_deployments}</p>
                  <p className="text-xs text-muted-foreground">suspended</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {runtimeStats.pool.max_active > 0
                      ? Math.round((runtimeStats.pool.active_workers / runtimeStats.pool.max_active) * 100)
                      : 0}<span className="text-sm font-normal text-muted-foreground">%</span>
                  </p>
                  <p className="text-xs text-muted-foreground">utilization</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent deployments */}
          <div>
            <p className="mb-3 text-sm font-medium">Recent Deployments</p>
            {deployments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No deployments yet</p>
            ) : (
              <div>
                {deployments.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center justify-between border-b border-border/50 py-3 last:border-b-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 size-1.5 rounded-full ${
                        d.status === "ready" ? "bg-emerald-500" :
                        d.status === "failed" ? "bg-red-500" :
                        d.status === "cancelled" ? "bg-zinc-400" : "bg-amber-500"
                      }`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm">{d.commit_message || d.commit_sha.slice(0, 7)}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(d.created_at)}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusBadgeClasses(d.status)}`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AnimatedPage>
  )
}
