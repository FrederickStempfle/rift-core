"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  Check,
  CircleStop,
  Copy,
  Database,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Workflow,
} from "lucide-react"
import { useService } from "@/hooks/use-services"
import { useServiceLogs } from "@/hooks/use-service-logs"
import { useDomains, useServerIp } from "@/hooks/use-domains"
import { AnimatedPage } from "@/components/animated-page"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const ACTIVE_STATUSES = new Set(["pending", "deploying", "removing"])

const SERVICE_META: Record<string, { icon: typeof Database; color: string }> = {
  supabase: { icon: Database, color: "text-emerald-600" },
  posthog: { icon: BarChart3, color: "text-blue-600" },
  n8n: { icon: Workflow, color: "text-orange-600" },
}

function getServiceMeta(serviceType: string) {
  return SERVICE_META[serviceType] ?? SERVICE_META.supabase
}

const STATUS_STYLES: Record<string, { dot: string; label: string; color: string }> = {
  running: { dot: "bg-emerald-500", label: "Running", color: "text-emerald-600" },
  deploying: { dot: "bg-amber-500 animate-pulse", label: "Deploying", color: "text-amber-600" },
  pending: { dot: "bg-amber-500 animate-pulse", label: "Pending", color: "text-amber-600" },
  stopped: { dot: "bg-gray-400", label: "Stopped", color: "text-muted-foreground" },
  failed: { dot: "bg-red-500", label: "Failed", color: "text-red-600" },
  removing: { dot: "bg-gray-400 animate-pulse", label: "Removing", color: "text-muted-foreground" },
}

type Tab = "overview" | "connection" | "logs" | "domains"

function CopyableField({
  label,
  value,
  masked = false,
}: {
  label: string
  value: string | undefined
  masked?: boolean
}) {
  const [visible, setVisible] = useState(!masked)
  const [copied, setCopied] = useState(false)

  if (!value) return null

  const displayValue = visible ? value : value.replace(/./g, "\u2022").slice(0, 40) + "..."

  function handleCopy() {
    navigator.clipboard.writeText(value!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 gap-2 px-5 py-3.5 sm:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">{displayValue}</p>
      </div>
      <div className="flex items-center gap-1">
        {masked && (
          <button
            onClick={() => setVisible(!visible)}
            className="rounded p-1.5 text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="rounded p-1.5 text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  )
}

function DeleteServiceDialog({
  open,
  onOpenChange,
  serviceId,
  serviceName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceId: string
  serviceName: string
}) {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const response = await fetch(`/api/services/${serviceId}`, { method: "DELETE" })
      if (!response.ok && response.status !== 202) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete service")
      }
      toast.success("Service deletion started")
      onOpenChange(false)
      router.push("/services")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete service")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Service</DialogTitle>
          <DialogDescription>
            This will stop all containers and permanently delete the service, including all data.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Type <span className="font-mono text-destructive">{serviceName}</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={serviceName}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={confirmText !== serviceName || deleting}
              onClick={handleDelete}
            >
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LogViewer({ serviceId, isActive }: { serviceId: string; isActive: boolean }) {
  const { logs } = useServiceLogs({ serviceId, isActive })
  const logsEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs.length, autoScroll])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50)
  }, [])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[500px] overflow-auto rounded-lg border bg-zinc-950 p-4 font-mono text-xs leading-5"
    >
      {logs.length === 0 ? (
        <p className="text-zinc-500">Waiting for logs...</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="flex gap-3">
            <span className="shrink-0 text-zinc-600 tabular-nums">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span
              className={
                log.level === "error"
                  ? "text-red-400"
                  : log.level === "warn"
                    ? "text-amber-400"
                    : "text-zinc-300"
              }
            >
              {log.message}
            </span>
          </div>
        ))
      )}
      <div ref={logsEndRef} />
    </div>
  )
}

type Endpoint = { label: string; targetUrl: string }

function getEndpoints(connectionInfo: NonNullable<ReturnType<typeof useService>["service"]>["connection_info"]): Endpoint[] {
  if (!connectionInfo) return []
  const endpoints: Endpoint[] = []
  // Prefer internal Docker network URLs (reachable from the engine container).
  // Fall back to localhost URLs for dev environments.
  if (connectionInfo.internal_api_url || connectionInfo.api_url) {
    endpoints.push({
      label: "API Gateway (Kong)",
      targetUrl: connectionInfo.internal_api_url ?? connectionInfo.api_url!,
    })
  }
  if (connectionInfo.internal_studio_url || connectionInfo.studio_url) {
    endpoints.push({
      label: "Studio Dashboard",
      targetUrl: connectionInfo.internal_studio_url ?? connectionInfo.studio_url!,
    })
  }
  // PostHog
  if (connectionInfo.internal_app_url || connectionInfo.app_url) {
    endpoints.push({
      label: "PostHog App",
      targetUrl: connectionInfo.internal_app_url ?? connectionInfo.app_url!,
    })
  }
  // n8n
  if (connectionInfo.internal_editor_url || connectionInfo.editor_url) {
    endpoints.push({
      label: "n8n Editor",
      targetUrl: connectionInfo.internal_editor_url ?? connectionInfo.editor_url!,
    })
  }
  return endpoints
}

function AssignServiceDomainDialog({
  open,
  onOpenChange,
  onAssigned,
  serviceId,
  endpoints,
  assignedDomainIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssigned: () => void
  serviceId: string
  endpoints: Endpoint[]
  assignedDomainIds: Set<string>
}) {
  const { domains: allDomains } = useDomains()
  const [selectedDomainId, setSelectedDomainId] = useState("")
  const [selectedEndpoint, setSelectedEndpoint] = useState(0)
  const [assigning, setAssigning] = useState(false)

  // Show domains that are unassigned (no project, no service) or not already assigned to this service
  const availableDomains = allDomains.filter(
    (d) => !d.projectId && !d.serviceId && !assignedDomainIds.has(d.id)
  )

  useEffect(() => {
    if (!open) {
      setSelectedDomainId("")
      setSelectedEndpoint(0)
    }
  }, [open])

  async function handleAssign() {
    if (!selectedDomainId || endpoints.length === 0) return
    setAssigning(true)
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId: selectedDomainId,
          action: "assign",
          serviceId,
          targetUrl: endpoints[selectedEndpoint].targetUrl,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to assign domain")
      }
      toast.success("Domain assigned to service")
      onAssigned()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Assign Domain</DialogTitle>
          <DialogDescription>
            Assign an existing domain to this service endpoint.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Domain</label>
            {availableDomains.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No unassigned domains available. Add a domain first from the{" "}
                <a href="/domains" className="text-primary hover:underline">Domains</a> page.
              </p>
            ) : (
              <select
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm outline-none"
                value={selectedDomainId}
                onChange={(e) => setSelectedDomainId(e.target.value)}
              >
                <option value="">Select a domain</option>
                {availableDomains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.domain}
                    {d.verified ? "" : " (pending verification)"}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Endpoint</label>
            <select
              className="flex h-9 w-full rounded-md border bg-background px-3 text-sm outline-none"
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(Number(e.target.value))}
            >
              {endpoints.map((ep, i) => (
                <option key={i} value={i}>
                  {ep.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Routes traffic to the {endpoints[selectedEndpoint]?.label.toLowerCase()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedDomainId || assigning}
              onClick={handleAssign}
            >
              {assigning && <Loader2 className="size-3.5 animate-spin" />}
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ServiceDomainsTab({
  serviceId,
  connectionInfo,
}: {
  serviceId: string
  connectionInfo: NonNullable<ReturnType<typeof useService>["service"]>["connection_info"]
}) {
  const { domains, mutate } = useDomains(undefined, serviceId)
  const serverIp = useServerIp()
  const [addOpen, setAddOpen] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const endpoints = getEndpoints(connectionInfo)

  async function handleVerify(domainId: string) {
    setVerifying(domainId)
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Verification failed")
      toast.success("Domain verified — SSL certificate will be provisioned")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setVerifying(null)
    }
  }

  async function handleDelete(domainId: string) {
    setDeleting(domainId)
    try {
      const res = await fetch(`/api/domains?id=${domainId}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete domain")
      }
      toast.success("Domain removed")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete domain")
    } finally {
      setDeleting(null)
    }
  }

  const sslStatusStyle: Record<string, { dot: string; label: string }> = {
    active: { dot: "bg-emerald-500", label: "SSL Active" },
    provisioning: { dot: "bg-amber-500 animate-pulse", label: "Provisioning SSL" },
    pending: { dot: "bg-gray-400", label: "Pending Verification" },
    failed: { dot: "bg-red-500", label: "SSL Failed" },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Custom Domains</h2>
          <p className="text-xs text-muted-foreground">
            Route custom domains to your service endpoints with automatic SSL.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddOpen(true)}
          disabled={endpoints.length === 0}
        >
          <Plus className="size-3.5" />
          Assign Domain
        </Button>
      </div>

      {endpoints.length === 0 && (
        <div className="rounded-lg border bg-muted/30 px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Service must be running to add domains. Start the service first.
          </p>
        </div>
      )}

      {domains.length === 0 && endpoints.length > 0 && (
        <div className="rounded-lg border bg-muted/30 px-5 py-8 text-center">
          <Globe className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No domains assigned. Add a domain from the{" "}
            <a href="/domains" className="text-primary hover:underline">Domains</a>{" "}
            page, then assign it here.
          </p>
        </div>
      )}

      {domains.length > 0 && (
        <div className="divide-y rounded-lg border">
          {domains.map((d) => {
            const ssl = sslStatusStyle[d.sslStatus] ?? sslStatusStyle.pending
            const endpointLabel = endpoints.find(
              (ep) => d.targetUrl && ep.targetUrl === d.targetUrl
            )?.label

            return (
              <div key={d.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-mono text-sm">{d.domain}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`size-1.5 rounded-full ${ssl.dot}`} />
                      <span className="text-xs text-muted-foreground">{ssl.label}</span>
                    </div>
                    {endpointLabel && (
                      <span className="text-xs text-muted-foreground">
                        → {endpointLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {d.sslStatus === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerify(d.id)}
                      disabled={verifying === d.id}
                    >
                      {verifying === d.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Verify
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(d.id)}
                    disabled={deleting === d.id}
                  >
                    {deleting === d.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {serverIp && domains.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Point your domain&apos;s A record to <code className="font-mono font-medium text-foreground">{serverIp}</code>
          </p>
        </div>
      )}

      <AssignServiceDomainDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAssigned={() => mutate()}
        serviceId={serviceId}
        endpoints={endpoints}
        assignedDomainIds={new Set(domains.map((d) => d.id))}
      />
    </div>
  )
}

export default function ServiceDetailPage() {
  const params = useParams<{ serviceId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { service, error, isLoading, mutate } = useService(params.serviceId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const activeTab = (searchParams.get("tab") as Tab) || "overview"
  const isActive = service ? ACTIVE_STATUSES.has(service.status) : false
  const style = STATUS_STYLES[service?.status ?? ""] ?? STATUS_STYLES.stopped
  const meta = getServiceMeta(service?.service_type ?? "supabase")
  const ServiceIcon = meta.icon

  function setTab(tab: Tab) {
    const newParams = new URLSearchParams(searchParams.toString())
    if (tab === "overview") {
      newParams.delete("tab")
    } else {
      newParams.set("tab", tab)
    }
    const qs = newParams.toString()
    router.replace(`/services/${params.serviceId}${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  async function handleAction(action: "stop" | "start" | "restart") {
    if (!service) return
    setActionLoading(action)
    try {
      const response = await fetch(`/api/services/${service.id}/${action}`, { method: "POST" })
      if (!response.ok && response.status !== 202) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Failed to ${action} service`)
      }
      toast.success(`Service ${action} initiated`)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} service`)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <AnimatedPage className="flex flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] rounded-lg" />
      </AnimatedPage>
    )
  }

  if (error || !service) {
    return (
      <AnimatedPage className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">{error || "Service not found"}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/services")}>
            Back to Services
          </Button>
        </div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/services")}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex size-9 items-center justify-center rounded-lg border bg-background">
            <ServiceIcon className={`size-4 ${meta.color}`} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{service.name}</h1>
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${style.dot}`} />
              <span className={`text-xs font-medium ${style.color}`}>{style.label}</span>
              <span className="text-xs text-muted-foreground capitalize">
                &middot; {service.service_type}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {service.status === "running" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("restart")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "restart" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Restart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("stop")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "stop" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CircleStop className="size-3.5" />
                )}
                Stop
              </Button>
            </>
          )}
          {service.status === "stopped" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("start")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "start" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              Start
            </Button>
          )}
          {!isActive && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {service.error_message && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{service.error_message}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["overview", "connection", "domains", "logs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-lg border">
            <div className="border-b bg-muted/30 px-5 py-3.5">
              <h2 className="text-sm font-semibold">Status</h2>
            </div>
            <div className="divide-y">
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${style.dot}`} />
                  <span className="text-sm font-medium">{style.label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm font-medium capitalize">{service.service_type}</span>
              </div>
              {service.started_at && (
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-muted-foreground">Started</span>
                  <span className="text-sm tabular-nums">
                    {new Date(service.started_at).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm tabular-nums">
                  {new Date(service.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          {(service.connection_info?.studio_url || service.connection_info?.app_url || service.connection_info?.editor_url || service.connection_info?.api_url) && (
            <section className="rounded-lg border">
              <div className="border-b bg-muted/30 px-5 py-3.5">
                <h2 className="text-sm font-semibold">Quick Links</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {service.connection_info?.studio_url && (
                  <a
                    href={service.connection_info.studio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Database className="size-3.5" />
                    Open Supabase Studio
                  </a>
                )}
                {service.connection_info?.editor_url && (
                  <a
                    href={service.connection_info.editor_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Workflow className="size-3.5" />
                    Open n8n Editor
                  </a>
                )}
                {service.connection_info?.api_url && (
                  <a
                    href={service.connection_info.api_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Globe className="size-3.5" />
                    API Endpoint
                  </a>
                )}
                {service.connection_info?.app_url && (
                  <a
                    href={service.connection_info.app_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <BarChart3 className="size-3.5" />
                    Open PostHog
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "connection" && (
        <section className="rounded-lg border">
          <div className="border-b bg-muted/30 px-5 py-3.5">
            <h2 className="text-sm font-semibold">Connection Details</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Use these credentials to connect your applications.
            </p>
          </div>
          {service.connection_info ? (
            <div className="divide-y">
              {/* Supabase fields */}
              <CopyableField label="API URL" value={service.connection_info.api_url} />
              <CopyableField label="Anon Key" value={service.connection_info.anon_key} masked />
              <CopyableField label="Service Role Key" value={service.connection_info.service_role_key} masked />
              <CopyableField label="Database Connection String" value={service.connection_info.db_connection_string} masked />
              {service.connection_info.studio_url && (
                <CopyableField label="Studio URL" value={service.connection_info.studio_url} />
              )}
              {/* PostHog fields */}
              <CopyableField label="App URL" value={service.connection_info.app_url} />
              {/* n8n fields */}
              <CopyableField label="Editor URL" value={service.connection_info.editor_url} />
              <CopyableField label="Webhook URL" value={service.connection_info.webhook_url} />
              <CopyableField label="Encryption Key" value={service.connection_info.encryption_key} masked />
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? "Connection details will appear once the service is running."
                  : "No connection details available."}
              </p>
            </div>
          )}
        </section>
      )}

      {activeTab === "domains" && (
        <ServiceDomainsTab serviceId={params.serviceId} connectionInfo={service.connection_info} />
      )}

      {activeTab === "logs" && (
        <LogViewer serviceId={params.serviceId} isActive={isActive || service.status === "running"} />
      )}

      <DeleteServiceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        serviceId={service.id}
        serviceName={service.name}
      />
    </AnimatedPage>
  )
}
