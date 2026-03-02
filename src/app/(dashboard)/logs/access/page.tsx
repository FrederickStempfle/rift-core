"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Filter, Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Project = {
  id: string
  name: string
}

type AccessLog = {
  id: number
  project_id: string | null
  timestamp: string
  client_ip: string
  host: string | null
  method: string
  path: string
  status: number
  duration_ms: number
}

type AccessLogsResponse = {
  logs: AccessLog[]
  next_before_id: number | null
}

function toIso(input: string): string | null {
  if (!input) return null
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function escapeCsvCell(input: string): string {
  if (!/[",\n]/.test(input)) {
    return input
  }
  return `"${input.replace(/"/g, "\"\"")}"`
}

export default function AccessLogsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState("all")
  const [host, setHost] = useState("")
  const [pathPrefix, setPathPrefix] = useState("")
  const [status, setStatus] = useState("")
  const [clientIp, setClientIp] = useState("")
  const [fromLocal, setFromLocal] = useState("")
  const [toLocal, setToLocal] = useState("")
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [nextBeforeId, setNextBeforeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/projects")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setProjects(
            data
              .filter((entry) => entry && typeof entry === "object")
              .map((entry) => ({
                id: String((entry as { id?: unknown }).id ?? ""),
                name: String((entry as { name?: unknown }).name ?? ""),
              }))
              .filter((entry) => entry.id && entry.name)
          )
        }
      })
      .catch(() => {})
  }, [])

  const buildSearchParams = useCallback(
    (beforeId?: number) => {
      const params = new URLSearchParams()
      if (projectId !== "all") params.set("projectId", projectId)
      if (beforeId) params.set("beforeId", String(beforeId))
      if (host.trim()) params.set("host", host.trim())
      if (pathPrefix.trim()) params.set("pathPrefix", pathPrefix.trim())
      if (status.trim()) params.set("status", status.trim())
      if (clientIp.trim()) params.set("clientIp", clientIp.trim())
      const fromIso = toIso(fromLocal)
      const toIsoValue = toIso(toLocal)
      if (fromIso) params.set("from", fromIso)
      if (toIsoValue) params.set("to", toIsoValue)
      params.set("limit", "200")
      return params
    },
    [projectId, host, pathPrefix, status, clientIp, fromLocal, toLocal]
  )

  const fetchLogs = useCallback(
    async (options?: { append: boolean }) => {
      const append = options?.append ?? false
      if (append) {
        if (!nextBeforeId) return
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const params = buildSearchParams(append ? nextBeforeId ?? undefined : undefined)
        const response = await fetch(`/api/access-logs?${params.toString()}`, {
          cache: "no-store",
        })
        const data = (await response.json()) as AccessLogsResponse | { error?: string }
        if (!response.ok) {
          setError(data && typeof data === "object" ? (data as { error?: string }).error ?? "Request failed" : "Request failed")
          return
        }
        const parsed = data as AccessLogsResponse
        setLogs((prev) => (append ? [...prev, ...parsed.logs] : parsed.logs))
        setNextBeforeId(parsed.next_before_id)
      } catch {
        setError("Failed to fetch access logs")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [buildSearchParams, nextBeforeId]
  )

  useEffect(() => {
    void fetchLogs({ append: false })
  }, [fetchLogs])

  const canLoadMore = nextBeforeId !== null && logs.length > 0

  const csvData = useMemo(() => {
    if (logs.length === 0) return ""
    const header = [
      "id",
      "timestamp",
      "project_id",
      "client_ip",
      "host",
      "method",
      "path",
      "status",
      "duration_ms",
    ]
    const rows = logs.map((entry) => [
      String(entry.id),
      entry.timestamp,
      entry.project_id ?? "",
      entry.client_ip,
      entry.host ?? "",
      entry.method,
      entry.path,
      String(entry.status),
      String(entry.duration_ms),
    ])
    return [header, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\n")
  }, [logs])

  const downloadCsv = useCallback(() => {
    if (!csvData) return
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `access-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, [csvData])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Access Logs</h1>
          <p className="text-sm text-muted-foreground">
            Trace client IP, host, route, status, and latency per request.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={downloadCsv}
          disabled={logs.length === 0}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="size-4 text-muted-foreground" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={host}
            onChange={(event) => setHost(event.target.value)}
            placeholder="Host (e.g. app.example.com)"
          />
          <Input
            value={pathPrefix}
            onChange={(event) => setPathPrefix(event.target.value)}
            placeholder="Path prefix (e.g. /api)"
          />
          <Input
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            placeholder="Status (e.g. 404)"
            inputMode="numeric"
          />
          <Input
            value={clientIp}
            onChange={(event) => setClientIp(event.target.value)}
            placeholder="Client IP"
          />
          <Input
            type="datetime-local"
            value={fromLocal}
            onChange={(event) => setFromLocal(event.target.value)}
            placeholder="From"
          />
          <Input
            type="datetime-local"
            value={toLocal}
            onChange={(event) => setToLocal(event.target.value)}
            placeholder="To"
          />
          <Button onClick={() => void fetchLogs({ append: false })} className="lg:col-span-1">
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="flex items-center gap-2 p-4 text-sm text-destructive">
              <ShieldAlert className="size-4" />
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading access logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No access logs for the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b bg-muted/30 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Timestamp</th>
                    <th className="px-3 py-2 font-medium">Client IP</th>
                    <th className="px-3 py-2 font-medium">Host</th>
                    <th className="px-3 py-2 font-medium">Method</th>
                    <th className="px-3 py-2 font-medium">Path</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((entry) => (
                    <tr key={entry.id} className="border-b align-top last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{entry.client_ip}</td>
                      <td className="px-3 py-2">{entry.host ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{entry.method}</td>
                      <td
                        className="max-w-[440px] truncate px-3 py-2 font-mono text-xs"
                        title={entry.path}
                      >
                        {entry.path}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{entry.status}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">
                        {entry.duration_ms} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {logs.length.toLocaleString()} request records
        </p>
        <Button
          variant="outline"
          onClick={() => void fetchLogs({ append: true })}
          disabled={!canLoadMore || loadingMore}
        >
          {loadingMore ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading older...
            </>
          ) : (
            "Load Older"
          )}
        </Button>
      </div>
    </div>
  )
}
