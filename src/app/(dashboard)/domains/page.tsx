"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Plus,
  Loader2,
  Trash2,
  Globe,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Link2,
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

type Domain = {
  id: string
  projectId: string | null
  projectName?: string | null
  domain: string
  isPrimary: boolean
  verified: boolean
  sslStatus: "pending" | "provisioning" | "active" | "failed"
}

type Project = {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Add Domain Dialog — just enter domain, no project needed
// ---------------------------------------------------------------------------

function AddDomainDialog({
  open,
  onOpenChange,
  onCreated,
  serverIp,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  serverIp: string | null
}) {
  const [step, setStep] = useState<"input" | "dns">("input")
  const [domain, setDomain] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [createdDomain, setCreatedDomain] = useState<string>("")

  useEffect(() => {
    if (!open) {
      setDomain("")
      setStep("input")
      setCreatedDomain("")
    }
  }, [open])

  const isValid =
    domain.length > 0 &&
    /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain)

  async function handleSubmit() {
    if (!isValid) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, isPrimary: false }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to add domain")
      }
      setCreatedDomain(domain)
      setStep("dns")
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>
            {step === "input" ? "Add Domain" : "Configure DNS"}
          </DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Enter the domain you want to connect. You can assign it to a project after verifying DNS."
              : `Add these records at your DNS provider to verify ${createdDomain}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="px-6 space-y-4 pb-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Domain</label>
              <Input
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
              {domain.length > 0 && !isValid && (
                <p className="text-xs text-destructive">Enter a valid domain name</p>
              )}
            </div>
            <Button
              className="w-full"
              disabled={!isValid || submitting}
              onClick={handleSubmit}
            >
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Add Domain
            </Button>
          </div>
        ) : (
          <div className="px-6 space-y-4 pb-6">
            <div className="space-y-3">
              <DnsRecordRow type="A" name={getDnsName(createdDomain ?? "")} value={serverIp ?? "…"} />
            </div>

            <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex gap-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  DNS changes can take up to 48 hours to propagate. Once you&apos;ve added the
                  records, use the Verify button on the domain to check.
                </span>
              </div>
            </div>

            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DnsRecordRow({
  type,
  name,
  value,
}: {
  type: string
  name: string
  value: string
}) {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
        {type} Record
      </span>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Name
          </span>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 truncate rounded bg-background px-2 py-1 font-mono text-xs border">
              {name}
            </code>
            <button
              onClick={() => copy(name, `${type}-name`)}
              className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied === `${type}-name` ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Value
          </span>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 truncate rounded bg-background px-2 py-1 font-mono text-xs border">
              {value}
            </code>
            <button
              onClick={() => copy(value, `${type}-value`)}
              className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied === `${type}-value` ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assign Domain Dialog
// ---------------------------------------------------------------------------

function AssignDomainDialog({
  domain,
  projects,
  onOpenChange,
  onAssigned,
}: {
  domain: Domain | null
  projects: Project[]
  onOpenChange: (open: boolean) => void
  onAssigned: () => void
}) {
  const [projectId, setProjectId] = useState("")
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (!domain) setProjectId("")
  }, [domain])

  async function handleAssign() {
    if (!domain || !projectId) return
    setAssigning(true)
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId: domain.id, action: "assign", projectId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to assign domain")
      }
      toast.success("Domain assigned to project")
      onAssigned()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setAssigning(false)
    }
  }

  return (
    <Dialog open={!!domain} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Assign to Project</DialogTitle>
          <DialogDescription>
            Assign{" "}
            <span className="font-mono font-medium text-foreground">
              {domain?.domain}
            </span>{" "}
            to a project.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Project</label>
            <select
              className="flex h-9 w-full rounded-md border bg-background px-3 text-sm outline-none"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={!projectId || assigning} onClick={handleAssign}>
              {assigning && <Loader2 className="size-3.5 animate-spin" />}
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Delete Dialog
// ---------------------------------------------------------------------------

function DeleteDomainDialog({
  domain,
  onOpenChange,
  onDeleted,
}: {
  domain: Domain | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!domain) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/domains?id=${domain.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete domain")
      }
      toast.success("Domain removed")
      onDeleted()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={!!domain} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Remove Domain</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-mono font-medium text-foreground">
              {domain?.domain}
            </span>
            ? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1" disabled={deleting} onClick={handleDelete}>
            {deleting && <Loader2 className="size-3.5 animate-spin" />}
            Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Domain Card
// ---------------------------------------------------------------------------

const sslColor: Record<string, string> = {
  active: "bg-emerald-500",
  provisioning: "bg-amber-500",
  pending: "bg-muted-foreground",
  failed: "bg-red-500",
}

const statusText: Record<string, string> = {
  active: "DNS verified",
  provisioning: "DNS verified",
  pending: "Pending DNS verification",
  failed: "DNS verification failed",
}

function DomainCard({
  domain,
  serverIp,
  onDelete,
  onRefresh,
  onSetPrimary,
  onAssign,
}: {
  domain: Domain
  serverIp: string | null
  onDelete: () => void
  onRefresh: () => void
  onSetPrimary?: () => void
  onAssign?: () => void
}) {
  const [expanded, setExpanded] = useState(!domain.verified)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  async function handleVerify() {
    setVerifying(true)
    setVerifyError(null)
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId: domain.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setVerifyError(
          data.error || "DNS records not found. Check your configuration and try again."
        )
        return
      }
      toast.success("Domain verified — DNS records confirmed")
      onRefresh()
    } catch {
      setVerifyError("Could not reach verification service. Try again.")
    } finally {
      setVerifying(false)
    }
  }

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

        <Globe className="size-4 text-muted-foreground shrink-0" />

        <span className="font-mono text-sm font-medium flex-1 min-w-0 truncate">
          {domain.domain}
        </span>

        {!domain.projectId && onAssign && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAssign()
            }}
            className="shrink-0 flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground border hover:bg-muted transition-colors"
          >
            <Link2 className="size-2.5" />
            Assign to project
          </button>
        )}

        {domain.isPrimary ? (
          <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Primary
          </span>
        ) : onSetPrimary && domain.verified && domain.projectId ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSetPrimary()
            }}
            className="shrink-0 rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground border hover:bg-muted transition-colors"
          >
            Set as primary
          </button>
        ) : null}

        <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <span className={`size-1.5 rounded-full ${sslColor[domain.sslStatus]}`} />
          {statusText[domain.sslStatus]}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Expanded: DNS instructions + verify */}
      {expanded && (
        <div className="border-t bg-muted/10 px-4 py-3 space-y-3">
          {domain.verified ? (
            <div className="flex items-center gap-2 py-1">
              <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                DNS verified. Domain is active and routing traffic.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <AlertCircle className="size-3.5 mt-0.5 text-amber-500 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Add the following DNS records at your provider, then click Verify.
                </p>
              </div>

              <DnsTable domain={domain.domain} serverIp={serverIp} />

              {verifyError && (
                <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-xs text-red-600 dark:text-red-400">{verifyError}</p>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                {verifying ? "Checking DNS records…" : "Verify DNS"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function getDnsName(domain: string): string {
  const parts = domain.split(".")
  if (parts.length <= 2) return "@"
  return parts.slice(0, -2).join(".")
}

function DnsTable({ domain, serverIp }: { domain: string; serverIp: string | null }) {
  const ip = serverIp ?? "…"
  return (
    <div className="overflow-hidden rounded-md border text-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Type</th>
            <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Value</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          <DnsRow type="A" name={getDnsName(domain)} value={ip} />
        </tbody>
      </table>
    </div>
  )
}

function DnsRow({ type, name, value }: { type: string; name: string; value: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-1.5">
        <span className="inline-flex rounded bg-muted px-1 py-0.5 text-[10px] font-semibold uppercase">
          {type}
        </span>
      </td>
      <td className="px-3 py-1.5 font-mono">{name}</td>
      <td className="px-3 py-1.5 font-mono">{value}</td>
      <td className="px-2 py-1.5">
        <button onClick={copy} className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
        </button>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Grouped Domain List
// ---------------------------------------------------------------------------

function GroupedDomainList({
  domains,
  serverIp,
  projects,
  onDelete,
  onRefresh,
  onAssign,
}: {
  domains: Domain[]
  serverIp: string | null
  projects: Project[]
  onDelete: (d: Domain) => void
  onRefresh: () => void
  onAssign: (d: Domain) => void
}) {
  const { assigned, unassigned } = useMemo(() => {
    const groups: Record<string, { projectName: string; domains: Domain[] }> = {}
    const unassigned: Domain[] = []
    for (const d of domains) {
      if (!d.projectId) {
        unassigned.push(d)
        continue
      }
      const key = d.projectId
      if (!groups[key]) {
        groups[key] = { projectName: d.projectName ?? "Unknown", domains: [] }
      }
      groups[key].domains.push(d)
    }
    return { assigned: Object.entries(groups), unassigned }
  }, [domains])

  async function handleSetPrimary(domainId: string) {
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, action: "update", isPrimary: true }),
      })
      if (res.ok) {
        toast.success("Primary domain updated")
        onRefresh()
      } else {
        toast.error("Failed to update primary domain")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <div className="space-y-6">
      {unassigned.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Unassigned</h3>
          <div className="space-y-2">
            {unassigned.map((d) => (
              <DomainCard
                key={d.id}
                serverIp={serverIp}
                domain={d}
                onDelete={() => onDelete(d)}
                onRefresh={onRefresh}
                onAssign={() => onAssign(d)}
              />
            ))}
          </div>
        </div>
      )}

      {assigned.map(([projectId, group]) => (
        <div key={projectId} className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{group.projectName}</h3>
            <a
              href={`/projects/${encodeURIComponent(group.projectName)}`}
              className="text-xs text-primary hover:underline"
            >
              View project
            </a>
          </div>
          <div className="space-y-2">
            {group.domains.map((d) => (
              <DomainCard
                key={d.id}
                serverIp={serverIp}
                domain={d}
                onDelete={() => onDelete(d)}
                onRefresh={onRefresh}
                onSetPrimary={() => handleSetPrimary(d.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null)
  const [assignTarget, setAssignTarget] = useState<Domain | null>(null)
  const [serverIp, setServerIp] = useState<string | null>(null)

  const fetchDomains = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [domainsRes, projectsRes, ipRes] = await Promise.all([
        fetch("/api/domains"),
        fetch("/api/projects"),
        serverIp ? null : fetch("/api/domains?serverIp=true"),
      ])
      if (!domainsRes.ok) throw new Error("Failed to fetch domains")
      setDomains(await domainsRes.json())
      if (!projectsRes.ok) throw new Error("Failed to fetch projects")
      setProjects(await projectsRes.json())
      if (ipRes) {
        const ipData = await ipRes.json()
        setServerIp(ipData.ip)
      }
    } catch {
      setError("Could not load domains")
    } finally {
      setLoading(false)
    }
  }, [serverIp])

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Domains</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add custom domains, verify DNS, and assign them to your projects.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />
          Add Domain
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
          <button onClick={fetchDomains} className="mt-2 text-xs text-primary hover:underline">
            Retry
          </button>
        </div>
      ) : domains.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Globe className="size-5 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-sm font-medium">No domains yet</h3>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            Add a custom domain, verify your DNS records, then assign it to a project.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" />
            Add Domain
          </Button>
        </div>
      ) : (
        <GroupedDomainList
          domains={domains}
          serverIp={serverIp}
          projects={projects}
          onDelete={(d) => setDeleteTarget(d)}
          onRefresh={fetchDomains}
          onAssign={(d) => setAssignTarget(d)}
        />
      )}

      <AddDomainDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={fetchDomains}
        serverIp={serverIp}
      />
      <DeleteDomainDialog
        domain={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={fetchDomains}
      />
      <AssignDomainDialog
        domain={assignTarget}
        projects={projects}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        onAssigned={fetchDomains}
      />
    </div>
  )
}
