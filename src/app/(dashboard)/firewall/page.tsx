"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Loader2, Plus, Shield, Trash2 } from "lucide-react"
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
import { toast } from "sonner"
import { useProjects } from "@/hooks/use-projects"
import { AnimatedPage } from "@/components/animated-page"

type FirewallRule = {
  id: string
  projectId: string
  cidr: string
  action: "allow" | "block"
  description: string
  createdAt: string
}

type FirewallMode = "allow_all" | "block_all"

export default function FirewallPage() {
  const { projects, isLoading: loadingProjects } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [togglingMode, setTogglingMode] = useState(false)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const { data: rulesData, mutate: mutateRules } = useSWR(
    selectedProjectId ? `/api/firewall?projectId=${encodeURIComponent(selectedProjectId)}` : null
  )
  const rules = (rulesData ?? []) as FirewallRule[]

  const { data: modeData, mutate: mutateMode } = useSWR(
    selectedProjectId ? `/api/firewall?projectId=${encodeURIComponent(selectedProjectId)}&mode=1` : null
  )
  const mode = (modeData?.mode ?? "allow_all") as FirewallMode

  const loadingRules = !rulesData && selectedProjectId !== null

  async function handleToggleMode() {
    if (!selectedProjectId) return
    const newMode = mode === "allow_all" ? "block_all" : "allow_all"
    setTogglingMode(true)
    try {
      const res = await fetch("/api/firewall", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId, mode: newMode }),
      })
      if (res.ok) {
        mutateMode()
        toast.success(`Firewall mode set to ${newMode === "allow_all" ? "Allow All" : "Block All"}`)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Failed to update mode")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setTogglingMode(false)
    }
  }

  async function handleDelete(ruleId: string) {
    if (!selectedProjectId) return
    try {
      const res = await fetch(
        `/api/firewall?id=${encodeURIComponent(ruleId)}&projectId=${encodeURIComponent(selectedProjectId)}`,
        { method: "DELETE" },
      )
      if (res.ok || res.status === 204) {
        toast.success("Rule deleted")
        mutateRules()
      } else {
        toast.error("Failed to delete rule")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  if (loadingProjects) {
    return (
      <div className="flex flex-col gap-8 p-4 sm:p-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <AnimatedPage className="flex flex-col gap-8 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Firewall</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control which IP addresses can access your deployments.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Shield className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">No projects yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a project first to configure firewall rules.
          </p>
        </div>
      ) : (
        <>
          {/* Project Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Project</label>
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Toggle */}
          <section className="rounded-lg border">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">Firewall Mode</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {mode === "allow_all"
                    ? "All traffic is allowed unless explicitly blocked."
                    : "All traffic is blocked unless explicitly allowed."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleMode}
                  disabled={togglingMode}
                  className={`relative inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors ${
                    mode === "allow_all"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {togglingMode && <Loader2 className="size-3 animate-spin" />}
                  {mode === "allow_all" ? "Allow All" : "Block All"}
                </button>
              </div>
            </div>
          </section>

          {/* Rules */}
          <section className="overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
              <h2 className="text-sm font-semibold">
                {mode === "allow_all" ? "Block Rules" : "Allow Rules"}
              </h2>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="size-3.5" />
                Add Rule
              </Button>
            </div>

            {loadingRules ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : rules.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Shield className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">No firewall rules</p>
                <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
                  {mode === "allow_all"
                    ? "All traffic is currently allowed. Add block rules to restrict access."
                    : "All traffic is currently blocked. Add allow rules to grant access."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        IP / CIDR
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Action
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-sm">{rule.cidr}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                              rule.action === "allow"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                : "bg-red-50 text-red-700 ring-red-600/20"
                            }`}
                          >
                            {rule.action === "allow" ? "Allow" : "Block"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {rule.description || "—"}
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* Add Rule Dialog */}
      {selectedProjectId && (
        <AddRuleDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          projectId={selectedProjectId}
          projectName={selectedProject?.name ?? ""}
          defaultAction={mode === "allow_all" ? "block" : "allow"}
          onCreated={() => mutateRules()}
        />
      )}
    </AnimatedPage>
  )
}

function AddRuleDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  defaultAction,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  defaultAction: "allow" | "block"
  onCreated: () => void
}) {
  const [cidr, setCidr] = useState("")
  const [action, setAction] = useState<"allow" | "block">(defaultAction)
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (open) {
      setCidr("")
      setAction(defaultAction)
      setDescription("")
    }
  }, [open, defaultAction])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cidr.trim()) return

    setCreating(true)
    try {
      const res = await fetch("/api/firewall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, cidr: cidr.trim(), action, description: description.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create rule")
      }
      toast.success("Firewall rule added")
      onOpenChange(false)
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Add Firewall Rule</DialogTitle>
          <DialogDescription>
            Add a rule for <span className="font-medium text-foreground">{projectName}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">IP Address or CIDR</label>
            <Input
              placeholder="192.168.1.0/24 or 10.0.0.1"
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              autoFocus
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Action</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAction("block")}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  action === "block"
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Block
              </button>
              <button
                type="button"
                onClick={() => setAction("allow")}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  action === "allow"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Allow
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Description <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <Input
              placeholder="e.g. Office VPN"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!cidr.trim() || creating}>
              {creating && <Loader2 className="size-3.5 animate-spin" />}
              Add Rule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
