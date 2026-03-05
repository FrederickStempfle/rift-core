"use client"

import { useMemo, useState } from "react"
import { Globe, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { AnimatedPage } from "@/components/animated-page"
import { useDomains } from "@/hooks/use-domains"
import { useProjectContext } from "../context"

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

export default function ProjectDomainsPage() {
  const { project } = useProjectContext()
  const { domains, isLoading: loading, mutate: mutateDomains } = useDomains(project?.id ?? undefined)
  const { domains: allDomains, mutate: mutateAllDomains } = useDomains()
  const [assignOpen, setAssignOpen] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const unassignedDomains = useMemo(
    () => allDomains.filter((d) => !d.projectId),
    [allDomains]
  )

  if (!project) return null

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
        body: JSON.stringify({ domainId, action: "assign", projectId: project!.id }),
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
    <AnimatedPage className="flex flex-col gap-4">
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
    </AnimatedPage>
  )
}
