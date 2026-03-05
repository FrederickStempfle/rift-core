"use client"

import { useState } from "react"
import { Eye, EyeOff, Key, Loader2, Plus, Trash2 } from "lucide-react"
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
import { AnimatedPage } from "@/components/animated-page"
import { useEnvVars } from "@/hooks/use-env-vars"
import { useProjectContext } from "../context"

type EnvVar = {
  id: string
  project_id: string
  key: string
  preview: string
}

export default function ProjectEnvPage() {
  const { project } = useProjectContext()
  const { envVars, isLoading, mutate: mutateEnvVars } = useEnvVars(project?.id ?? null)
  const [addOpen, setAddOpen] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [showValue, setShowValue] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!project) return null

  async function handleAdd() {
    if (!project || !newKey.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/env-vars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, key: newKey.trim(), value: newValue }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to add variable")
      toast.success(`Variable "${newKey.trim()}" saved`)
      setNewKey("")
      setNewValue("")
      setShowValue(false)
      setAddOpen(false)
      void mutateEnvVars()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add variable")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(envVar: EnvVar) {
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

  return (
    <AnimatedPage className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Environment Variables</p>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />
          Add Variable
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border">
        {isLoading ? (
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
            {envVars.map((v: EnvVar) => (
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
                  onClick={() => void handleDelete(v)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) { setNewKey(""); setNewValue(""); setShowValue(false) } }}>
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
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <div className="relative">
                <Input
                  type={showValue ? "text" : "password"}
                  placeholder="Enter value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showValue ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void handleAdd()} disabled={saving || !newKey.trim()}>
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
