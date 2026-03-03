"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  GitBranch,
  GitCommit,
  Globe,
  Key,
  Loader2,
  MoreVertical,
  Plus,
  Rocket,
  Settings,
  Trash2,
} from "lucide-react"
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useDeployLogs } from "@/hooks/use-deploy-logs"
import { useProject } from "@/hooks/use-projects"
import { useDeployments } from "@/hooks/use-deployments"
import { useEnvVars } from "@/hooks/use-env-vars"
import { useAnalytics } from "@/hooks/use-analytics"
import { useRuntimeStatus, useRuntimeStats } from "@/hooks/use-runtime-status"
import { useDomains } from "@/hooks/use-domains"
import { AnimatedPage } from "@/components/animated-page"
import { AnimatedTabContent } from "@/components/animated-tab-content"

const ACTIVE_DEPLOYMENT_STATUSES = new Set(["queued", "cloning", "building", "deploying"])

type Project = {
  id: string
  user_id: string
  name: string
  repo_url: string
  branch: string
  framework: string
  build_command?: string | null
  output_dir?: string | null
  install_command?: string | null
  subdomain?: string | null
  public_url?: string | null
  webhook_id?: number | null
  created_at: string
  updated_at: string
}

type Deployment = {
  id: string
  project_id: string
  commit_sha: string
  commit_message?: string | null
  branch: string
  status: string
  build_duration_ms?: number | null
  url?: string | null
  public_url?: string | null
  started_at?: string | null
  finished_at?: string | null
  created_at: string
}

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

type EnvVar = {
  id: string
  project_id: string
  key: string
  preview: string
}

type Tab = "overview" | "analytics" | "env" | "logs" | "domains" | "usage" | "settings"

const TAB_CONFIG: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "env", label: "Environment" },
  { id: "logs", label: "Logs" },
  { id: "domains", label: "Domains" },
  { id: "usage", label: "Usage" },
  { id: "settings", label: "Settings" },
]

function statusBadgeClasses(status: string): string {
  switch (status) {
    case "ready":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    case "failed":
      return "bg-red-50 text-red-700 ring-red-600/20"
    case "queued":
      return "bg-zinc-50 text-zinc-600 ring-zinc-500/20"
    case "cancelled":
      return "bg-zinc-50 text-zinc-600 ring-zinc-500/20"
    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20"
  }
}

const statusLabel: Record<string, string> = {
  ready: "Ready",
  queued: "Queued",
  cloning: "Cloning",
  building: "Building",
  deploying: "Deploying",
  failed: "Failed",
  cancelled: "Cancelled",
}

function timeAgo(dateStr: string): string {
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

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Delete Project Dialog
// ---------------------------------------------------------------------------

function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [confirmName, setConfirmName] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) setConfirmName("")
  }, [open])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(project.id)}`, {
        method: "DELETE",
      })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete project")
      }
      toast.success("Project deleted")
      router.push("/projects")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            This will permanently delete{" "}
            <span className="font-mono font-medium text-foreground">{project.name}</span>{" "}
            and all associated deployments. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Type <span className="font-mono text-destructive">{project.name}</span> to confirm
            </label>
            <Input
              placeholder={project.name}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={confirmName !== project.name || deleting}
              onClick={handleDelete}
            >
              {deleting && <Loader2 className="size-3.5 animate-spin" />}
              Delete Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Deployment Row
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Settings Tab
// ---------------------------------------------------------------------------

function SettingsTab({
  project,
  onUpdated,
  onDeleteClick,
}: {
  project: Project
  onUpdated: () => void
  onDeleteClick: () => void
}) {
  const [branch, setBranch] = useState(project.branch)
  const [buildCommand, setBuildCommand] = useState(project.build_command ?? "")
  const [installCommand, setInstallCommand] = useState(project.install_command ?? "")
  const [outputDir, setOutputDir] = useState(project.output_dir ?? "")
  const [saving, setSaving] = useState(false)

  const hasChanges =
    branch !== project.branch ||
    buildCommand !== (project.build_command ?? "") ||
    installCommand !== (project.install_command ?? "") ||
    outputDir !== (project.output_dir ?? "")

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(project.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch,
          build_command: buildCommand || null,
          install_command: installCommand || null,
          output_dir: outputDir || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update project")
      }
      toast.success("Settings saved")
      onUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Build & Deploy */}
      <section className="rounded-lg border">
        <div className="border-b px-5 py-4">
          <p className="text-sm font-medium">Build & Deploy</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Configure how your project is built and deployed.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Production Branch</label>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Framework</label>
              <Input value={project.framework} disabled className="bg-muted/50" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Build Command</label>
              <Input placeholder="npm run build" value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Install Command</label>
              <Input placeholder="npm install" value={installCommand} onChange={(e) => setInstallCommand(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5 sm:max-w-[calc(50%-0.5rem)]">
            <label className="text-xs font-medium text-muted-foreground">Output Directory</label>
            <Input placeholder=".next" value={outputDir} onChange={(e) => setOutputDir(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end border-t px-5 py-3">
          <Button size="sm" disabled={!hasChanges || saving} onClick={handleSave}>
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </section>

      {/* Project Info */}
      <section className="rounded-lg border">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-medium">Project Info</h2>
        </div>
        <div className="divide-y">
          {([
            ["Project ID", project.id, true],
            ["Repository", project.repo_url, true],
            ["Subdomain", project.subdomain, true],
            ["Created", new Date(project.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), false],
          ] as const).map(([label, value, copyable]) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`mt-0.5 truncate text-sm ${label === "Project ID" || label === "Subdomain" ? "font-mono" : ""}`}>
                  {value}
                </p>
              </div>
              {copyable && <CopyButton value={value as string} />}
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-lg border border-destructive/20">
        <div className="border-b border-destructive/20 px-5 py-4">
          <h2 className="text-sm font-medium text-destructive">Danger Zone</h2>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-medium">Delete this project</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Permanently remove this project and all of its deployments.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={onDeleteClick}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Domains Tab
// ---------------------------------------------------------------------------

const domainStatusText: Record<string, string> = {
  active: "DNS verified",
  provisioning: "DNS verified",
  pending: "Pending DNS verification",
  failed: "DNS verification failed",
}

const domainStatusColor: Record<string, string> = {
  active: "bg-emerald-500",
  provisioning: "bg-amber-500",
  pending: "bg-muted-foreground",
  failed: "bg-red-500",
}

function DomainsTab({ project }: { project: Project }) {
  const { domains, isLoading: loading, mutate: mutateDomains } = useDomains(project.id)
  const { domains: allDomains, mutate: mutateAllDomains } = useDomains()
  const [assignOpen, setAssignOpen] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const unassignedDomains = useMemo(
    () => allDomains.filter((d) => !d.projectId),
    [allDomains]
  )

  function refreshDomains() {
    void mutateDomains()
    void mutateAllDomains()
  }

  async function handleAssign(domainId: string) {
    setAssigningId(domainId)
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, action: "assign", projectId: project.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to assign domain")
      }
      toast.success("Domain assigned")
      setAssignOpen(false)
      refreshDomains()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setAssigningId(null)
    }
  }

  async function handleUnassign(domainId: string) {
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, action: "assign", projectId: null }),
      })
      if (res.ok) {
        toast.success("Domain unassigned")
        refreshDomains()
      } else {
        toast.error("Failed to unassign domain")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function handleSetPrimary(domainId: string) {
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, action: "update", isPrimary: true }),
      })
      if (res.ok) {
        toast.success("Primary domain updated")
        refreshDomains()
      } else {
        toast.error("Failed to update primary domain")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Custom Domains</p>
        <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
          <Globe className="size-3.5" />
          Assign Domain
        </Button>
      </div>
      <section className="overflow-hidden rounded-lg border">

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-40" />
                <div className="flex-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : domains.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Globe className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">No domains assigned</p>
            <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
              Assign a verified domain from your{" "}
              <a href="/domains" className="text-primary hover:underline">domains page</a>{" "}
              to serve this project on a custom URL.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {domains.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <Globe className="size-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-sm font-medium flex-1 min-w-0 truncate">
                  {d.domain}
                </span>

                {d.isPrimary && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary shrink-0">
                    Primary
                  </span>
                )}

                <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <span className={`size-1.5 rounded-full ${domainStatusColor[d.sslStatus]}`} />
                  {domainStatusText[d.sslStatus]}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  {!d.isPrimary && d.verified && (
                    <button
                      onClick={() => handleSetPrimary(d.id)}
                      className="rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground border hover:bg-muted transition-colors"
                    >
                      Set as primary
                    </button>
                  )}
                  <button
                    onClick={() => handleUnassign(d.id)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Unassign from project"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Assign Domain Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Assign Domain</DialogTitle>
            <DialogDescription>
              Choose a domain to assign to <span className="font-medium text-foreground">{project.name}</span>.
              You can add new domains from the{" "}
              <a href="/domains" className="text-primary hover:underline">domains page</a>.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {unassignedDomains.length === 0 ? (
              <div className="flex flex-col items-center py-6">
                <p className="text-sm text-muted-foreground">No unassigned domains available.</p>
                <a href="/domains" className="mt-2 text-xs text-primary hover:underline">
                  Go to Domains to add one
                </a>
              </div>
            ) : (
              <div className="space-y-1.5">
                {unassignedDomains.map((d) => (
                  <button
                    key={d.id}
                    disabled={assigningId === d.id}
                    onClick={() => handleAssign(d.id)}
                    className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                  >
                    <Globe className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-sm font-medium flex-1 min-w-0 truncate">
                      {d.domain}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <span className={`size-1.5 rounded-full ${domainStatusColor[d.sslStatus]}`} />
                      {domainStatusText[d.sslStatus]}
                    </span>
                    {assigningId === d.id && <Loader2 className="size-3.5 animate-spin shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  const params = useParams<{ projectName: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const projectName = decodeURIComponent(params.projectName)

  // URL-based tab state
  const rawTab = searchParams.get("tab") as Tab | null
  const tab: Tab = rawTab && TAB_CONFIG.some((t) => t.id === rawTab) ? rawTab : "overview"
  function setTab(newTab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    if (newTab === "overview") {
      params.delete("tab")
    } else {
      params.set("tab", newTab)
    }
    const query = params.toString()
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false })
  }

  // Local state
  const [deploying, setDeploying] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [analyticsPeriod, setAnalyticsPeriod] = useState("24h")

  // SWR hooks
  const { project, isLoading: loadingProject, error, mutate: mutateProjects } = useProject(projectName)
  const { deployments, isLoading: loadingDeployments, mutate: mutateDeployments } = useDeployments(project?.id ?? null)
  const { analytics: analyticsData, isLoading: loadingAnalytics } = useAnalytics(
    tab === "analytics" ? project?.id ?? null : null,
    analyticsPeriod
  )
  const { runtimeStatus, isLoading: loadingRuntimeStatus } = useRuntimeStatus(
    tab === "usage" ? project?.id ?? null : null
  )
  const { runtimeStats } = useRuntimeStats()
  const { envVars, isLoading: loadingEnvVars, mutate: mutateEnvVars } = useEnvVars(
    tab === "env" ? project?.id ?? null : null
  )
  const [addEnvOpen, setAddEnvOpen] = useState(false)
  const [newEnvKey, setNewEnvKey] = useState("")
  const [newEnvValue, setNewEnvValue] = useState("")
  const [showEnvValue, setShowEnvValue] = useState(false)
  const [savingEnv, setSavingEnv] = useState(false)
  const previousDeploymentStatus = useRef<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const loadingUsage = loadingRuntimeStatus

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

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  async function handleAddEnvVar() {
    if (!project || !newEnvKey.trim()) return
    setSavingEnv(true)
    try {
      const res = await fetch("/api/env-vars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, key: newEnvKey.trim(), value: newEnvValue }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to add variable")
      toast.success(`Variable "${newEnvKey.trim()}" saved`)
      setNewEnvKey("")
      setNewEnvValue("")
      setShowEnvValue(false)
      setAddEnvOpen(false)
      void mutateEnvVars()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add variable")
    } finally {
      setSavingEnv(false)
    }
  }

  async function handleDeleteEnvVar(envVar: EnvVar) {
    if (!project) return
    try {
      const res = await fetch(`/api/env-vars?id=${encodeURIComponent(envVar.id)}&projectId=${encodeURIComponent(project.id)}`, {
        method: "DELETE",
      })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete variable")
      }
      toast.success(`Variable "${envVar.key}" deleted`)
      void mutateEnvVars()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete variable")
    }
  }

  async function handleDeploy() {
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
  }

  if (loadingProject) {
    return (
      <div className="p-4 sm:p-8">
        <div className="space-y-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="mt-8 space-y-6">
          <Skeleton className="h-24 w-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <Skeleton className="size-3.5 shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void mutateProjects()}>Retry</Button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/projects")}>
          <ArrowLeft className="size-3.5" />
          Back to Projects
        </Button>
      </div>
    )
  }

  return (
    <AnimatedPage className="p-4 sm:px-8 sm:py-6">
      {/* Header — flat, no boxes */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/projects")}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Back to projects"
            >
              <ArrowLeft className="size-4" />
            </button>
            <h1 className="text-lg font-semibold">{project.name}</h1>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${
                latestDeployment?.status === "ready" ? "bg-emerald-500" :
                latestDeploymentIsActive ? "bg-amber-400 animate-pulse" :
                latestDeployment?.status === "failed" ? "bg-red-500" : "bg-zinc-300"
              }`} />
              {latestDeployment?.status === "ready" ? "Production" :
               latestDeployment ? (statusLabel[latestDeployment.status] ?? latestDeployment.status) : "Not deployed"}
            </span>
            <span className="text-border">&middot;</span>
            <span className="font-mono text-[11px]">{project.framework}</span>
            <span className="text-border">&middot;</span>
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] hover:text-foreground transition-colors"
            >
              <GitBranch className="size-3" />
              {project.repo_url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
            </a>
            {project.public_url && (
              <>
                <span className="text-border">&middot;</span>
                <a
                  href={project.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[11px] hover:text-foreground transition-colors"
                >
                  {project.public_url.replace(/^https?:\/\//, "")}
                  <ExternalLink className="size-2.5" />
                </a>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleDeploy} disabled={deploying}>
            {deploying ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
            Deploy
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="size-8 p-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTab("settings")}>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs — underline style, no container */}
      <div className="mt-6 border-b">
        <nav className="-mb-px flex gap-0">
          {TAB_CONFIG.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative px-4 pb-2.5 text-sm transition-colors ${
                tab === id
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {tab === id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        <AnimatedTabContent tabKey={tab}>
        {tab === "domains" ? (
          <DomainsTab project={project} />
        ) : tab === "analytics" ? (
          <div className="space-y-6">
            {/* Period selector */}
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">Request Metrics</p>
              <div className="flex gap-1">
                {ANALYTICS_PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setAnalyticsPeriod(p.value)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                      analyticsPeriod === p.value
                        ? "bg-foreground text-background font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stat row — inline, not cards */}
            {loadingAnalytics ? (
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

              {loadingAnalytics ? (
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
                                {formatBucketTime(bucket.bucket, analyticsPeriod)}
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
                    <span>{formatBucketTime(analyticsData.buckets[0].bucket, analyticsPeriod)}</span>
                    {analyticsData.buckets.length > 2 && (
                      <span>
                        {formatBucketTime(
                          analyticsData.buckets[Math.floor(analyticsData.buckets.length / 2)].bucket,
                          analyticsPeriod
                        )}
                      </span>
                    )}
                    <span>
                      {formatBucketTime(
                        analyticsData.buckets[analyticsData.buckets.length - 1].bucket,
                        analyticsPeriod
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
          </div>
        ) : tab === "env" ? (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">Environment Variables</p>
              <Button size="sm" variant="outline" onClick={() => setAddEnvOpen(true)}>
                <Plus className="size-3.5" />
                Add Variable
              </Button>
            </div>

            <section className="overflow-hidden rounded-lg border">
              {loadingEnvVars ? (
                <div className="space-y-0">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  ))}
                </div>
              ) : envVars.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Key className="size-5 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium">No environment variables</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add variables like API keys and secrets for your deployments.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {envVars.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <code className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-medium">
                          {v.key}
                        </code>
                        <span className="truncate font-mono text-xs text-muted-foreground">
                          {v.preview}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => void handleDeleteEnvVar(v)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Dialog open={addEnvOpen} onOpenChange={(open) => { setAddEnvOpen(open); if (!open) { setNewEnvKey(""); setNewEnvValue(""); setShowEnvValue(false) } }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Environment Variable</DialogTitle>
                  <DialogDescription>
                    Variables are encrypted at rest and injected into your deployments.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key</label>
                    <Input
                      placeholder="e.g. OPENROUTER_API_KEY"
                      value={newEnvKey}
                      onChange={(e) => setNewEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Value</label>
                    <div className="relative">
                      <Input
                        type={showEnvValue ? "text" : "password"}
                        placeholder="Enter value"
                        value={newEnvValue}
                        onChange={(e) => setNewEnvValue(e.target.value)}
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEnvValue(!showEnvValue)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showEnvValue ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setAddEnvOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => void handleAddEnvVar()} disabled={savingEnv || !newEnvKey.trim()}>
                      {savingEnv ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : tab === "logs" ? (
          <section className="overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <p className="text-sm font-medium">Build Logs</p>
              <div className="flex items-center gap-2">
                {logsConnected && <span className="size-1.5 rounded-full bg-emerald-500" title="Live" />}
                {latestDeploymentIsActive && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                {latestDeployment && (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {latestDeployment.commit_sha.slice(0, 7)}
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-[600px] overflow-auto bg-[#1a1625] p-4">
              {logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#6e6588]">No build logs available.</p>
              ) : (
                <div className="space-y-0.5 font-mono text-[13px] leading-6">
                  {logs.map((log, i) => (
                    <div key={log.id} className="flex">
                      <span className="mr-4 select-none text-right text-[#3d3555]" style={{ minWidth: "2.5ch" }}>
                        {i + 1}
                      </span>
                      <span className="mr-3 shrink-0 text-[#5a4f72]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <span
                        className={
                          log.level === "error"
                            ? "text-red-400"
                            : log.level === "warn"
                              ? "text-amber-400"
                              : "text-[#d4cfde]"
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </section>
        ) : tab === "usage" ? (
          <div className="space-y-6">
            {loadingUsage ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>
            ) : (
              <>
                {/* Runtime status — inline stats, not cards */}
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
                      {runtimeStatus?.deployment_id ? runtimeStatus.deployment_id.slice(0, 8) : "—"}
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
          </div>
        ) : tab === "overview" ? (
          <>
            {/* Production deployment — hero card */}
            {latestDeployment && latestDeployment.status === "ready" && (
              <div className="mb-8 rounded-lg border p-5">
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
              <div className="mb-8 flex items-center gap-3 rounded-lg border border-amber-200/60 bg-amber-50/30 px-5 py-4">
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

            {/* Deployment list — no wrapping card, just rows */}
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
          </>
        ) : (
          <SettingsTab
            project={project}
            onUpdated={() => void mutateProjects()}
            onDeleteClick={() => setDeleteOpen(true)}
          />
        )}
        </AnimatedTabContent>
      </div>

      <DeleteProjectDialog project={project} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </AnimatedPage>
  )
}
