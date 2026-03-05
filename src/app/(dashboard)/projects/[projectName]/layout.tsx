"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Loader2,
  MoreVertical,
  Rocket,
  Settings,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { ProjectProvider, useProjectContext, statusLabel } from "./context"
import type { Project } from "@/hooks/use-projects"

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

function ProjectHeader() {
  const router = useRouter()
  const {
    project,
    projectName,
    isLoading,
    error,
    latestDeployment,
    latestDeploymentIsActive,
    deploying,
    handleDeploy,
    mutateProjects,
    deleteOpen,
    setDeleteOpen,
  } = useProjectContext()

  if (isLoading) {
    return (
      <div className="p-4 sm:px-8 sm:py-6">
        <div className="space-y-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void mutateProjects()}>Retry</Button>
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
    <>
      <div className="p-4 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/projects")}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Back to projects"
              >
                <ArrowLeft className="size-4" />
              </button>
              <h1 className="text-lg font-semibold">{project.name}</h1>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${
                  latestDeployment?.status === "ready" ? "bg-emerald-500" :
                  latestDeploymentIsActive ? "bg-amber-400 animate-pulse" :
                  latestDeployment?.status === "failed" ? "bg-red-500" : "bg-zinc-300"
                }`} />
                {latestDeployment?.status === "ready" ? "Production" :
                 latestDeployment ? (statusLabel[latestDeployment.status] ?? latestDeployment.status) : "Not deployed"}
              </span>
              <span className="text-border">&middot;</span>
              <span className="font-mono text-[11px]">{project.framework}</span>
              <span className="text-border">&middot;</span>
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] hover:text-foreground transition-colors"
              >
                <GitBranch className="size-3" />
                {project.repo_url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
              </a>
              {project.public_url && (
                <>
                  <span className="text-border">&middot;</span>
                  <a
                    href={project.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] hover:text-foreground transition-colors"
                  >
                    {project.public_url.replace(/^https?:\/\//, "")}
                    <ExternalLink className="size-2.5" />
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => void handleDeploy()} disabled={deploying}>
              {deploying ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
              Deploy
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/projects/${encodeURIComponent(projectName)}/settings`)}>
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
      </div>

      <DeleteProjectDialog project={project} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  )
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <ProjectHeader />
      <div className="px-4 pb-6 sm:px-8">{children}</div>
    </ProjectProvider>
  )
}
