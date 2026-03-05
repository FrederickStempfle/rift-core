"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  ExternalLink,
  Globe,
  Route,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedPage } from "@/components/animated-page"
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Project = {
  id: string
  name: string
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

// ---------------------------------------------------------------------------
// Chart configs
// ---------------------------------------------------------------------------

const requestsChartConfig = {
  requests: { label: "Requests", color: "var(--chart-1)" },
  errors: { label: "Errors", color: "var(--color-destructive)" },
} satisfies ChartConfig

const responseTimeChartConfig = {
  avg_ms: { label: "Avg Response (ms)", color: "var(--chart-2)" },
} satisfies ChartConfig

const referrerChartConfig = {
  requests: { label: "Requests", color: "var(--chart-1)" },
} satisfies ChartConfig

const pathChartConfig = {
  requests: { label: "Requests", color: "var(--chart-3)" },
} satisfies ChartConfig

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PERIODS = [
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
] as const

function formatBucketTime(iso: string, period: string): string {
  const d = new Date(iso)
  if (period === "24h") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState("all")
  const [period, setPeriod] = useState("24h")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch project list
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setProjects(d)
      })
      .catch(() => {})
  }, [])

  // Fetch analytics when project or period changes
  const fetchKey = `${selectedProject}:${period}`
  useEffect(() => {
    if (!fetchKey) return
    const params = new URLSearchParams({ period })
    if (selectedProject !== "all") {
      params.set("projectId", selectedProject)
    }
    let stale = false
    setData(null)
    fetch(`/api/analytics?${params}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!stale && d) setData(d as AnalyticsData) })
      .catch(() => {})
      .finally(() => { if (!stale) setLoading(false) })
    return () => { stale = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey])

  // Format bucket data for charts
  const chartData =
    data?.buckets.map((b) => ({
      time: formatBucketTime(b.bucket, period),
      requests: b.requests,
      errors: b.errors,
      avg_ms: Math.round(b.avg_ms * 100) / 100,
      cold_starts: b.cold_starts,
    })) ?? []

  const referrerData =
    data?.top_referrers.map((r) => ({
      referrer: r.referrer,
      requests: r.requests,
    })) ?? []

  const pathData =
    data?.top_paths.map((p) => ({
      path: p.path,
      requests: p.requests,
      errors: p.errors,
      avg_ms: Math.round(p.avg_ms),
    })) ?? []

  return (
    <AnimatedPage className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor traffic, performance, and where your visitors come from.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-lg" />
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="size-4" />
                <span className="text-xs font-medium">Total Requests</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatNumber(data.total_requests)}
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
                {data.avg_response_ms.toFixed(0)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  ms
                </span>
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
                {data.error_rate.toFixed(1)}
                <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                  %
                </span>
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
                {formatNumber(data.total_cold_starts)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Requests Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="size-4 text-muted-foreground" />
            Requests Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={requestsChartConfig} className="h-[280px] w-full">
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
                  <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-destructive)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--chart-1)"
                  fill="url(#fillRequests)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  stroke="var(--color-destructive)"
                  fill="url(#fillErrors)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyState icon={BarChart3} message="No request data yet" />
          )}
        </CardContent>
      </Card>

      {/* Response Time Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4 text-muted-foreground" />
            Response Time Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={responseTimeChartConfig} className="h-[240px] w-full">
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
          ) : (
            <EmptyState icon={Clock} message="No response time data yet" />
          )}
        </CardContent>
      </Card>

      {/* Traffic Sources + Top Pages */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="size-4 text-muted-foreground" />
              Top Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : referrerData.length > 0 ? (
              <ChartContainer config={referrerChartConfig} className="h-[300px] w-full">
                <BarChart
                  data={referrerData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    dataKey="referrer"
                    type="category"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                    width={120}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="requests"
                    fill="var(--chart-1)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState icon={Globe} message="No referrer data yet" />
            )}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Route className="size-4 text-muted-foreground" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : pathData.length > 0 ? (
              <ChartContainer config={pathChartConfig} className="h-[300px] w-full">
                <BarChart
                  data={pathData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    dataKey="path"
                    type="category"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                    width={120}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="requests"
                    fill="var(--chart-3)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState icon={Route} message="No path data yet" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      {!loading && data && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Referrer table */}
          {data.top_referrers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <ExternalLink className="size-4 text-muted-foreground" />
                  Traffic Sources Detail
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Source
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                          Requests
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_referrers.map((r) => (
                        <tr key={r.referrer} className="border-b last:border-0">
                          <td className="px-4 py-2.5 font-medium">
                            {r.referrer}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {r.requests.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {data.total_requests > 0
                              ? ((r.requests / data.total_requests) * 100).toFixed(1)
                              : "0.0"}
                            %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paths table */}
          {data.top_paths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Route className="size-4 text-muted-foreground" />
                  Pages Detail
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Path
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                          Requests
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                          Errors
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                          Avg (ms)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_paths.map((p) => (
                        <tr key={p.path} className="border-b last:border-0">
                          <td className="px-4 py-2.5 font-mono text-xs font-medium">
                            {p.path}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {p.requests.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {p.errors > 0 ? (
                              <span className="text-destructive">
                                {p.errors.toLocaleString()}
                              </span>
                            ) : (
                              "0"
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {p.avg_ms.toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AnimatedPage>
  )
}

// ---------------------------------------------------------------------------
// Empty state component
// ---------------------------------------------------------------------------

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>
  message: string
}) {
  return (
    <div className="flex flex-col items-center py-12">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Data will appear once your deployments receive traffic.
      </p>
    </div>
  )
}
