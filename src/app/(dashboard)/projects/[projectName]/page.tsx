"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
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
  Route,
  Settings,
  TerminalSquare,
  Trash2,
  Zap,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
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
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

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
  subdomain: string
  public_url: string
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

type DeployLog = {
  id: number
  deployment_id: string
  timestamp: string
  level: string
  message: string
  source: string
}

type Domain = {
  id: string
  projectId: string | null
  domain: string
  isPrimary: boolean
  verified: boolean
  sslStatus: "pending" | "provisioning" | "active" | "failed"
}

type AnalyticsBucket = {
  bucket: string
  requests: number
  errors: number
  avg_ms: number
  cold_starts: number
}

type ReferrerEntry = {
  referrer: string
  requests: number
}

type PathEntry = {
  path: string
  requests: number
  errors: number
  avg_ms: number
}

type AnalyticsData = {
  buckets: AnalyticsBucket[]
  total_requests: number
  total_errors: number
  total_cold_starts: number
  avg_response_ms: number
  error_rate: number
  top_referrers: ReferrerEntry[]
  top_paths: PathEntry[]
}

const analyticsRequestsConfig = {
  requests: { label: "Requests", color: "var(--chart-1)" },
  errors: { label: "Errors", color: "var(--color-destructive)" },
} satisfies ChartConfig

const analyticsResponseConfig = {
  avg_ms: { label: "Avg Response (ms)", color: "var(--chart-2)" },
} satisfies ChartConfig

const analyticsReferrerConfig = {
  requests: { label: "Requests", color: "var(--chart-1)" },
} satisfies ChartConfig

const analyticsPathConfig = {
  requests: { label: "Requests", color: "var(--chart-3)" },
} satisfies ChartConfig

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

type Tab = "overview" | "analytics" | "env" | "logs" | "domains" | "settings"

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

function DeploymentRow({ deployment, isLatest }: { deployment: Deployment; isLatest: boolean }) {
  const isActive = ACTIVE_DEPLOYMENT_STATUSES.has(deployment.status)

  return (
    <div className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
      {/* Status indicator */}
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
        {isActive ? (
          <Loader2 className="size-3.5 animate-spin text-amber-600" />
        ) : deployment.status === "ready" ? (
          <Check className="size-3.5 text-emerald-600" />
        ) : deployment.status === "failed" ? (
          <span className="size-1.5 rounded-full bg-red-500" />
        ) : (
          <span className="size-1.5 rounded-full bg-zinc-400" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {deployment.commit_message || "Manual deployment"}
          </p>
          {isLatest && (
            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Latest
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-mono">
            <GitCommit className="size-3" />
            {deployment.commit_sha.slice(0, 7)}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-3" />
            {deployment.branch}
          </span>
          {deployment.build_duration_ms != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {formatDuration(deployment.build_duration_ms)}
            </span>
          )}
          <span>{timeAgo(deployment.created_at)}</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
        {deployment.public_url && deployment.status === "ready" && (
          <a
            href={deployment.public_url}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
          >
            <ExternalLink className="size-3" />
            Visit
          </a>
        )}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusBadgeClasses(deployment.status)}`}
        >
          {isActive && <Loader2 className="size-2.5 animate-spin" />}
          {statusLabel[deployment.status] ?? deployment.status}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Analytics Tab
// ---------------------------------------------------------------------------

function AnalyticsTab({
  analyticsData,
  loadingAnalytics,
  analyticsPeriod,
  setAnalyticsPeriod,
  formatBucketTime,
}: {
  analyticsData: AnalyticsData | null
  loadingAnalytics: boolean
  analyticsPeriod: string
  setAnalyticsPeriod: (v: string) => void
  formatBucketTime: (iso: string, period: string) => string
}) {
  const chartData =
    analyticsData?.buckets.map((b) => ({
      time: formatBucketTime(b.bucket, analyticsPeriod),
      requests: b.requests,
      errors: b.errors,
      avg_ms: Math.round(b.avg_ms * 100) / 100,
      cold_starts: b.cold_starts,
    })) ?? []

  const referrerData =
    analyticsData?.top_referrers?.map((r) => ({
      referrer: r.referrer,
      requests: r.requests,
    })) ?? []

  const pathData =
    analyticsData?.top_paths?.map((p) => ({
      path: p.path,
      requests: p.requests,
    })) ?? []

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="size-4" />
          <span className="text-sm font-medium">Request Metrics</span>
        </div>
        <div className="flex rounded-md border shadow-sm">
          {ANALYTICS_PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setAnalyticsPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                analyticsPeriod === p.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      {loadingAnalytics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : analyticsData ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="size-4" />
                <span className="text-xs font-medium">Total Requests</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {analyticsData.total_requests.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                <span className="text-xs font-medium">Avg Response Time</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {analyticsData.avg_response_ms.toFixed(0)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">ms</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="size-4" />
                <span className="text-xs font-medium">Error Rate</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {analyticsData.error_rate.toFixed(1)}
                <span className="ml-0.5 text-sm font-normal text-muted-foreground">%</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="size-4" />
                <span className="text-xs font-medium">Cold Starts</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {(analyticsData.total_cold_starts ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Requests Over Time — Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="size-4 text-muted-foreground" />
            Requests Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAnalytics ? (
            <Skeleton className="h-[240px] w-full" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={analyticsRequestsConfig} className="h-[240px] w-full">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  width={48}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="projFillRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="projFillErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-destructive)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--chart-1)"
                  fill="url(#projFillRequests)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  stroke="var(--color-destructive)"
                  fill="url(#projFillErrors)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
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
        </CardContent>
      </Card>

      {/* Response Time Trend — Line Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="size-4 text-muted-foreground" />
              Response Time Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={analyticsResponseConfig} className="h-[200px] w-full">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  width={48}
                  unit="ms"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="avg_ms"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Traffic Sources + Top Pages */}
      {(referrerData.length > 0 || pathData.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {referrerData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Globe className="size-4 text-muted-foreground" />
                  Top Traffic Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={analyticsReferrerConfig} className="h-[250px] w-full">
                  <BarChart
                    data={referrerData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="referrer"
                      type="category"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="requests" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
          {pathData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Route className="size-4 text-muted-foreground" />
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={analyticsPathConfig} className="h-[250px] w-full">
                  <BarChart
                    data={pathData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="path"
                      type="category"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="requests" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
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
          <h2 className="text-sm font-semibold">Build & Deploy</h2>
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
          <h2 className="text-sm font-semibold">Project Info</h2>
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
          <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
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
  const [domains, setDomains] = useState<Domain[]>([])
  const [allDomains, setAllDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const unassignedDomains = useMemo(
    () => allDomains.filter((d) => !d.projectId),
    [allDomains]
  )

  const fetchDomains = useCallback(async () => {
    setLoading(true)
    try {
      const [projectRes, allRes] = await Promise.all([
        fetch(`/api/domains?projectId=${encodeURIComponent(project.id)}`),
        fetch("/api/domains"),
      ])
      if (projectRes.ok) setDomains(await projectRes.json())
      if (allRes.ok) setAllDomains(await allRes.json())
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

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
      fetchDomains()
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
        fetchDomains()
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
        fetchDomains()
      } else {
        toast.error("Failed to update primary domain")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
          <h2 className="text-sm font-semibold">Custom Domains</h2>
          <Button size="sm" onClick={() => setAssignOpen(true)}>
            <Globe className="size-3.5" />
            Assign Domain
          </Button>
        </div>

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
  const projectName = decodeURIComponent(params.projectName)

  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProject, setLoadingProject] = useState(true)
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [logs, setLogs] = useState<DeployLog[]>([])
  const [loadingDeployments, setLoadingDeployments] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("overview")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [analyticsPeriod, setAnalyticsPeriod] = useState("24h")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [envVars, setEnvVars] = useState<EnvVar[]>([])
  const [loadingEnvVars, setLoadingEnvVars] = useState(false)
  const [addEnvOpen, setAddEnvOpen] = useState(false)
  const [newEnvKey, setNewEnvKey] = useState("")
  const [newEnvValue, setNewEnvValue] = useState("")
  const [showEnvValue, setShowEnvValue] = useState(false)
  const [savingEnv, setSavingEnv] = useState(false)
  const previousDeploymentStatus = useRef<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const project = useMemo(
    () => projects.find((item) => item.name === projectName) ?? null,
    [projects, projectName]
  )

  const latestDeployment = deployments[0] ?? null
  const latestDeploymentIsActive = latestDeployment
    ? ACTIVE_DEPLOYMENT_STATUSES.has(latestDeployment.status)
    : false

  const loadProjects = useCallback(async () => {
    setLoadingProject(true)
    setError(null)
    try {
      const response = await fetch("/api/projects", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to load projects")
      setProjects(data as Project[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects")
    } finally {
      setLoadingProject(false)
    }
  }, [])

  const loadDeployments = useCallback(async (projectId: string) => {
    setLoadingDeployments(true)
    try {
      const response = await fetch(`/api/deployments?project_id=${encodeURIComponent(projectId)}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to load deployments")
      const items = data as Deployment[]
      setDeployments(items)

      if (items[0]) {
        const logsRes = await fetch(`/api/logs?deployment_id=${encodeURIComponent(items[0].id)}`, { cache: "no-store" })
        const logsData = await logsRes.json().catch(() => [])
        if (logsRes.ok) setLogs(logsData as DeployLog[])
      } else {
        setLogs([])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load deployments")
    } finally {
      setLoadingDeployments(false)
    }
  }, [])

  useEffect(() => { void loadProjects() }, [loadProjects])

  useEffect(() => {
    if (project?.id) void loadDeployments(project.id)
  }, [project?.id, loadDeployments])

  useEffect(() => {
    if (!project?.id || !latestDeploymentIsActive) return
    const timer = window.setTimeout(() => void loadDeployments(project.id), 3000)
    return () => window.clearTimeout(timer)
  }, [project?.id, latestDeployment?.id, latestDeployment?.status, latestDeploymentIsActive, loadDeployments])

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

  // Fetch analytics when tab is active
  useEffect(() => {
    if (tab !== "analytics" || !project?.id) return
    setLoadingAnalytics(true)
    fetch(`/api/analytics?projectId=${encodeURIComponent(project.id)}&period=${encodeURIComponent(analyticsPeriod)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setAnalyticsData(data as AnalyticsData) })
      .catch(() => {})
      .finally(() => setLoadingAnalytics(false))
  }, [tab, project?.id, analyticsPeriod])

  // Fetch env vars when tab is active
  const loadEnvVars = useCallback(async (projectId: string) => {
    setLoadingEnvVars(true)
    try {
      const res = await fetch(`/api/env-vars?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setEnvVars(data as EnvVar[])
      }
    } catch {
      // silently fail
    } finally {
      setLoadingEnvVars(false)
    }
  }, [])

  useEffect(() => {
    if (tab !== "env" || !project?.id) return
    void loadEnvVars(project.id)
  }, [tab, project?.id, loadEnvVars])

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
      void loadEnvVars(project.id)
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
      void loadEnvVars(project.id)
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
      await loadDeployments(project.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start deployment")
    } finally {
      setDeploying(false)
    }
  }

  if (loadingProject) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-9 w-48 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void loadProjects()}>Retry</Button>
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
    <div className="flex flex-col gap-0 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/projects")}
            className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
              <span className="rounded-md border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {project.framework}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <GitBranch className="size-3" />
                {project.repo_url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
              </a>
              {project.public_url && (
                <a
                  href={project.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Globe className="size-3" />
                  {project.public_url.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleDeploy} disabled={deploying}>
            {deploying ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
            Deploy
          </Button>
          {project.public_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.public_url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                Visit
              </a>
            </Button>
          )}
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

      {/* Tabs */}
      <div className="-mx-4 border-b px-4 sm:-mx-6 sm:px-6">
        <nav className="flex gap-6">
          {(["overview", "analytics", "env", "logs", "domains", "settings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative pb-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "env" ? "Environment" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="pt-6">
        {tab === "domains" ? (
          <DomainsTab project={project} />
        ) : tab === "analytics" ? (
          <AnalyticsTab
            analyticsData={analyticsData}
            loadingAnalytics={loadingAnalytics}
            analyticsPeriod={analyticsPeriod}
            setAnalyticsPeriod={setAnalyticsPeriod}
            formatBucketTime={formatBucketTime}
          />
        ) : tab === "env" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Key className="size-4" />
                <span className="text-sm font-medium">Environment Variables</span>
              </div>
              <Button size="sm" onClick={() => setAddEnvOpen(true)}>
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
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <TerminalSquare className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Build Logs</h2>
              </div>
              <div className="flex items-center gap-2">
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
        ) : tab === "overview" ? (
          <div className="space-y-6">
            {/* Deployments */}
            <section className="overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                <h2 className="text-sm font-semibold">Deployments</h2>
                <div className="flex items-center gap-2">
                  {loadingDeployments && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                  {deployments.length > 0 && (
                    <span className="text-xs text-muted-foreground">{deployments.length} total</span>
                  )}
                </div>
              </div>

              {deployments.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Rocket className="size-5 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium">No deployments yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click Deploy to create your first deployment.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {deployments.map((d, i) => (
                    <DeploymentRow key={d.id} deployment={d} isLatest={i === 0} />
                  ))}
                </div>
              )}

              {latestDeploymentIsActive && (
                <div className="border-t bg-amber-50/50 px-4 py-2.5">
                  <p className="flex items-center gap-2 text-xs font-medium text-amber-700">
                    <Loader2 className="size-3 animate-spin" />
                    Deployment in progress — auto-refreshing
                  </p>
                </div>
              )}
            </section>

          </div>
        ) : (
          <SettingsTab
            project={project}
            onUpdated={() => void loadProjects()}
            onDeleteClick={() => setDeleteOpen(true)}
          />
        )}
      </div>

      <DeleteProjectDialog project={project} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  )
}
