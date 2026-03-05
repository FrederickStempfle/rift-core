"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { useProject, type Project } from "@/hooks/use-projects"
import { useDeployments, type Deployment } from "@/hooks/use-deployments"
import { useDeployLogs } from "@/hooks/use-deploy-logs"

const ACTIVE_DEPLOYMENT_STATUSES = new Set(["queued", "cloning", "building", "deploying"])

export type ProjectContextValue = {
  project: Project | null
  projectName: string
  isLoading: boolean
  error: string | null
  deployments: Deployment[]
  loadingDeployments: boolean
  latestDeployment: Deployment | null
  latestDeploymentIsActive: boolean
  logs: { id: number; deployment_id: string; timestamp: string; level: string; message: string; source: string }[]
  logsConnected: boolean
  resetLogs: () => void
  deploying: boolean
  handleDeploy: () => Promise<void>
  mutateProjects: () => void
  mutateDeployments: () => void
  deleteOpen: boolean
  setDeleteOpen: (open: boolean) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function useProjectContext() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error("useProjectContext must be used within ProjectProvider")
  return ctx
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ projectName: string }>()
  const projectName = decodeURIComponent(params.projectName)

  const { project, isLoading, error, mutate: mutateProjects } = useProject(projectName)
  const { deployments, isLoading: loadingDeployments, mutate: mutateDeployments } = useDeployments(project?.id ?? null)

  const [deploying, setDeploying] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const previousDeploymentStatus = useRef<string | null>(null)

  const latestDeployment = deployments[0] ?? null
  const latestDeploymentIsActive = latestDeployment
    ? ACTIVE_DEPLOYMENT_STATUSES.has(latestDeployment.status)
    : false

  const { logs, connected: logsConnected, reset: resetLogs } = useDeployLogs({
    deploymentId: latestDeployment?.id ?? null,
    isActive: latestDeploymentIsActive,
  })

  // Deployment status change toasts
  useEffect(() => {
    if (!latestDeployment) { previousDeploymentStatus.current = null; return }
    const prev = previousDeploymentStatus.current
    previousDeploymentStatus.current = latestDeployment.status
    if (!prev || prev === latestDeployment.status) return
    if (latestDeployment.status === "ready" && latestDeployment.url) toast.success("Deployment is live")
    else if (latestDeployment.status === "failed") toast.error("Deployment failed")
  }, [latestDeployment])

  const handleDeploy = useCallback(async () => {
    if (!project) return
    setDeploying(true)
    try {
      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ project_id: project.id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to start deployment")
      toast.success("Deployment queued")
      resetLogs()
      void mutateDeployments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start deployment")
    } finally {
      setDeploying(false)
    }
  }, [project, resetLogs, mutateDeployments])

  return (
    <ProjectContext.Provider
      value={{
        project,
        projectName,
        isLoading,
        error,
        deployments,
        loadingDeployments,
        latestDeployment,
        latestDeploymentIsActive,
        logs,
        logsConnected,
        resetLogs,
        deploying,
        handleDeploy,
        mutateProjects,
        mutateDeployments,
        deleteOpen,
        setDeleteOpen,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

// Shared helpers

export const statusLabel: Record<string, string> = {
  ready: "Ready",
  queued: "Queued",
  cloning: "Cloning",
  building: "Building",
  deploying: "Deploying",
  failed: "Failed",
  cancelled: "Cancelled",
}

export function statusBadgeClasses(status: string): string {
  switch (status) {
    case "ready":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    case "failed":
      return "bg-red-50 text-red-700 ring-red-600/20"
    case "queued":
    case "cancelled":
      return "bg-zinc-50 text-zinc-600 ring-zinc-500/20"
    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20"
  }
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}
