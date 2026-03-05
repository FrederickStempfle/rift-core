"use client"

import { useEffect } from "react"
import {
  AlertTriangle,
  Check,
  ExternalLink,
  GitCommit,
  Globe,
  Loader2,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatedPage } from "@/components/animated-page"
import { CopyButton } from "@/components/copy-button"
import {
  useProjectContext,
  statusBadgeClasses,
  statusLabel,
  timeAgo,
  formatDuration,
} from "./context"
import type { Deployment } from "@/hooks/use-deployments"

const ACTIVE_DEPLOYMENT_STATUSES = new Set(["queued", "cloning", "building", "deploying"])

function DeploymentRow({ deployment }: { deployment: Deployment }) {
  const isActive = ACTIVE_DEPLOYMENT_STATUSES.has(deployment.status)

  return (
    <div className="group flex items-start gap-3 border-b border-border/50 px-0 py-3 last:border-b-0">
      <div className="mt-1.5 shrink-0">
        {isActive ? (
          <Loader2 className="size-3.5 animate-spin text-amber-500" />
        ) : deployment.status === "ready" ? (
          <Check className="size-3.5 text-emerald-600" />
        ) : deployment.status === "failed" ? (
          <AlertTriangle className="size-3.5 text-red-500" />
        ) : (
          <GitCommit className="size-3.5 text-muted-foreground/50" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm">
              {deployment.commit_message || (
                <span className="text-muted-foreground">No commit message</span>
              )}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <span className="font-mono">{deployment.commit_sha.slice(0, 7)}</span>
              <span className="text-border">on</span>
              <span className="font-mono">{deployment.branch}</span>
              {deployment.build_duration_ms != null && (
                <>
                  <span className="text-border">&middot;</span>
                  <span className="tabular-nums">{formatDuration(deployment.build_duration_ms)}</span>
                </>
              )}
              <span className="text-border">&middot;</span>
              <span>{timeAgo(deployment.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            {deployment.public_url && deployment.status === "ready" && (
              <a
                href={deployment.public_url}
                target="_blank"
                rel="noreferrer"
                className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                <ExternalLink className="size-3.5" />
              </a>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusBadgeClasses(deployment.status)}`}
            >
              {isActive && <Loader2 className="size-2.5 animate-spin" />}
              {statusLabel[deployment.status] ?? deployment.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProjectOverviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    project,
    deployments,
    loadingDeployments,
    latestDeployment,
    latestDeploymentIsActive,
  } = useProjectContext()

  // Redirect old ?tab= URLs to new routes
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && tab !== "overview" && project) {
      router.replace(`/projects/${encodeURIComponent(project.name)}/${tab}`)
    }
  }, [searchParams, project, router])

  if (!project) return null

  return (
    <AnimatedPage className="flex flex-col gap-6">
      {/* Production deployment hero card */}
      {latestDeployment && latestDeployment.status === "ready" && (
        <div className="rounded-lg border p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Production Deployment</p>
              <p className="mt-1.5 truncate text-sm font-medium">
                {latestDeployment.commit_message || "Manual deployment"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span className="font-mono">{latestDeployment.commit_sha.slice(0, 7)}</span>
                <span className="text-border">on</span>
                <span className="font-mono">{latestDeployment.branch}</span>
                {latestDeployment.build_duration_ms != null && (
                  <>
                    <span className="text-border">&middot;</span>
                    <span className="tabular-nums">{formatDuration(latestDeployment.build_duration_ms)}</span>
                  </>
                )}
                <span className="text-border">&middot;</span>
                <span>{timeAgo(latestDeployment.created_at)}</span>
              </div>
            </div>
            {project.public_url && (
              <a
                href={project.public_url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Visit
              </a>
            )}
          </div>
          {project.public_url && (
            <div className="mt-3 flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
              <Globe className="size-3 shrink-0" />
              <span className="truncate">{project.public_url.replace(/^https?:\/\//, "")}</span>
              <CopyButton value={project.public_url} />
            </div>
          )}
        </div>
      )}

      {/* Active deployment banner */}
      {latestDeploymentIsActive && latestDeployment && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200/60 bg-amber-50/30 px-5 py-4">
          <Loader2 className="size-4 animate-spin text-amber-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {statusLabel[latestDeployment.status] ?? "Deploying"}
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{latestDeployment.commit_sha.slice(0, 7)}</span>
              {latestDeployment.commit_message && (
                <>
                  <span className="text-border">&middot;</span>
                  <span className="truncate">{latestDeployment.commit_message}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deployment list */}
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm font-medium">Deployments</p>
          {loadingDeployments && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        </div>

        {deployments.length === 0 && !loadingDeployments ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No deployments yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Push to your repository or click Deploy to get started.</p>
          </div>
        ) : (
          <div>
            {deployments.map((d) => (
              <DeploymentRow key={d.id} deployment={d} />
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}
