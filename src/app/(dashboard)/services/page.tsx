"use client"

import { useState, useEffect, useRef } from "react"
import {
  Plus,
  Loader2,
  Trash2,
  Database,
  Copy,
  Check,
  Square,
  Play,
  RotateCw,
  ChevronDown,
  ChevronRight,
  ScrollText,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useServices } from "@/hooks/use-services"
import { useServiceLogs } from "@/hooks/use-service-logs"
import { AnimatedPage } from "@/components/animated-page"
import type { Service } from "@/hooks/use-services"

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const statusColor: Record<string, string> = {
  running: "bg-emerald-500",
  deploying: "bg-amber-500 animate-pulse",
  stopped: "bg-muted-foreground",
  failed: "bg-red-500",
  removing: "bg-muted-foreground animate-pulse",
  pending: "bg-muted-foreground animate-pulse",
}

const statusLabel: Record<string, string> = {
  running: "Running",
  deploying: "Deploying",
  stopped: "Stopped",
  failed: "Failed",
  removing: "Removing",
  pending: "Pending",
}

// ---------------------------------------------------------------------------
// Create Service Dialog
// ---------------------------------------------------------------------------

function CreateServiceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [name, setName] = useState("supabase")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) setName("supabase")
  }, [open])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_type: "supabase", name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create service")
      }
      toast.success("Supabase deployment started")
      onCreated()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Deploy Supabase</DialogTitle>
          <DialogDescription>
            Deploy a new Supabase instance. This will pull Docker images and
            start all required services.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 space-y-4 pb-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Instance Name</label>
            <Input
              placeholder="supabase"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <Button
            className="w-full"
            disabled={!name.trim() || submitting}
            onClick={handleSubmit}
          >
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Deploy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Delete Service Dialog
// ---------------------------------------------------------------------------

function DeleteServiceDialog({
  service,
  onOpenChange,
  onDeleted,
}: {
  service: Service | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!service) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/services?id=${service.id}`, {
        method: "DELETE",
      })
      if (!res.ok && res.status !== 202 && res.status !== 204) {
        throw new Error("Failed to delete service")
      }
      toast.success("Service removal started")
      onDeleted()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={!!service} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Delete Service</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-mono font-medium text-foreground">
              {service?.name}
            </span>
            ? This will stop all containers and remove all data. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting && <Loader2 className="size-3.5 animate-spin" />}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Service Logs Dialog
// ---------------------------------------------------------------------------

function ServiceLogsDialog({
  service,
  onOpenChange,
}: {
  service: Service | null
  onOpenChange: (open: boolean) => void
}) {
  const { logs, reset } = useServiceLogs(service?.id ?? null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!service) reset()
  }, [service, reset])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const levelColor: Record<string, string> = {
    info: "text-blue-400",
    warn: "text-amber-400",
    error: "text-red-400",
  }

  return (
    <Dialog open={!!service} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Deployment Logs</DialogTitle>
          <DialogDescription>
            Live logs for{" "}
            <span className="font-mono font-medium text-foreground">
              {service?.name}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div
          ref={scrollRef}
          className="mx-6 mb-6 h-80 overflow-y-auto rounded-md border bg-zinc-950 p-3 font-mono text-xs leading-relaxed"
        >
          {logs.length === 0 ? (
            <span className="text-zinc-500">Waiting for logs...</span>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2">
                <span className="text-zinc-600 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`shrink-0 uppercase w-12 ${levelColor[log.level] ?? "text-zinc-400"}`}
                >
                  {log.level}
                </span>
                <span className="text-zinc-300 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Copy Button helper
// ---------------------------------------------------------------------------

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <code className="flex-1 truncate rounded bg-background px-2 py-1 font-mono text-xs border">
          {value}
        </code>
        <button
          onClick={copy}
          className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Service Card
// ---------------------------------------------------------------------------

function ServiceCard({
  service,
  onDelete,
  onShowLogs,
  onRefresh,
}: {
  service: Service
  onDelete: () => void
  onShowLogs: () => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function handleAction(action: "stop" | "start" | "restart") {
    setActionLoading(action)
    try {
      const res = await fetch(
        `/api/services?id=${service.id}&action=${action}`,
        { method: "POST" }
      )
      if (!res.ok && res.status !== 202) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to ${action} service`)
      }
      toast.success(
        action === "stop"
          ? "Stopping service..."
          : action === "start"
            ? "Starting service..."
            : "Restarting service..."
      )
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  const conn = service.connection_info

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
        )}

        <Database className="size-4 text-muted-foreground shrink-0" />

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{service.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {service.service_type}
          </span>
        </div>

        <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <span
            className={`size-1.5 rounded-full ${statusColor[service.status] ?? "bg-muted-foreground"}`}
          />
          {statusLabel[service.status] ?? service.status}
        </span>

        {/* Action buttons */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onShowLogs}
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="View logs"
          >
            <ScrollText className="size-3.5" />
          </button>

          {service.status === "running" && (
            <>
              <button
                onClick={() => handleAction("restart")}
                disabled={!!actionLoading}
                className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Restart"
              >
                {actionLoading === "restart" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCw className="size-3.5" />
                )}
              </button>
              <button
                onClick={() => handleAction("stop")}
                disabled={!!actionLoading}
                className="rounded p-1 text-muted-foreground hover:text-amber-500 transition-colors"
                title="Stop"
              >
                {actionLoading === "stop" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Square className="size-3.5" />
                )}
              </button>
            </>
          )}

          {service.status === "stopped" && (
            <button
              onClick={() => handleAction("start")}
              disabled={!!actionLoading}
              className="rounded p-1 text-muted-foreground hover:text-emerald-500 transition-colors"
              title="Start"
            >
              {actionLoading === "start" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
            </button>
          )}

          <button
            onClick={onDelete}
            className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {service.error_message && (
        <div className="border-t bg-red-500/5 px-4 py-2">
          <p className="text-xs text-red-600 dark:text-red-400">
            {service.error_message}
          </p>
        </div>
      )}

      {/* Expanded: connection info */}
      {expanded && conn && (
        <div className="border-t bg-muted/10 px-4 py-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {conn.api_url && <CopyValue label="API URL" value={conn.api_url} />}
            {conn.studio_url && (
              <div className="space-y-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Studio URL
                </span>
                <div className="flex items-center gap-1.5">
                  <code className="flex-1 truncate rounded bg-background px-2 py-1 font-mono text-xs border">
                    {conn.studio_url}
                  </code>
                  <a
                    href={conn.studio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            )}
            {conn.anon_key && (
              <CopyValue label="Anon Key" value={conn.anon_key} />
            )}
            {conn.service_role_key && (
              <CopyValue
                label="Service Role Key"
                value={conn.service_role_key}
              />
            )}
          </div>
          {conn.db_connection_string && (
            <CopyValue
              label="Database Connection String"
              value={conn.db_connection_string}
            />
          )}
        </div>
      )}

      {expanded && !conn && service.status === "running" && (
        <div className="border-t bg-muted/10 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Connection info not available yet.
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ServicesPage() {
  const { services, isLoading: loading, error, mutate } = useServices()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [logsTarget, setLogsTarget] = useState<Service | null>(null)

  return (
    <AnimatedPage className="flex flex-col gap-8 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deploy and manage Supabase instances.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />
          Deploy Supabase
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-40" />
                <div className="flex-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => void mutate()}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Database className="size-5 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-sm font-medium">No services yet</h3>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            Deploy a Supabase instance to get a managed PostgreSQL database,
            auth, storage, and real-time capabilities.
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5" />
            Deploy Supabase
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onDelete={() => setDeleteTarget(service)}
              onShowLogs={() => setLogsTarget(service)}
              onRefresh={() => void mutate()}
            />
          ))}
        </div>
      )}

      <CreateServiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void mutate()}
      />
      <DeleteServiceDialog
        service={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={() => void mutate()}
      />
      <ServiceLogsDialog
        service={logsTarget}
        onOpenChange={(open) => !open && setLogsTarget(null)}
      />
    </AnimatedPage>
  )
}
