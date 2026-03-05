"use client"

import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { AnimatedPage } from "@/components/animated-page"
import { CopyButton } from "@/components/copy-button"
import type { Project } from "@/hooks/use-projects"
import { useProjectContext } from "../context"

export default function ProjectSettingsPage() {
  const { project, mutateProjects, setDeleteOpen } = useProjectContext()

  if (!project) return null

  return (
    <AnimatedPage className="flex flex-col gap-6">
      <SettingsForm
        project={project}
        onUpdated={() => void mutateProjects()}
        onDeleteClick={() => setDeleteOpen(true)}
      />
    </AnimatedPage>
  )
}

function SettingsForm({
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
