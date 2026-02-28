"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { GitBranch, Globe, Plus, Search, Loader2, Link, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
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

type GitHubRepo = {
  name: string
  fullName: string
  url: string
  defaultBranch: string
  private: boolean
  language: string | null
  updatedAt: string
}

type Project = {
  id: string
  user_id: string
  name: string
  repo_url: string
  branch: string
  framework: string
  build_command?: string | null
  output_dir?: string | null
  install_command?: string | null
  subdomain: string
  public_url: string
  webhook_id?: number | null
  created_at: string
  updated_at: string
}

type Mode = "github" | "public"

function NewProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("github")
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  const [repoSearch, setRepoSearch] = useState("")
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [publicUrl, setPublicUrl] = useState("")
  const [projectName, setProjectName] = useState("")
  const [branch, setBranch] = useState("")
  const [branches, setBranches] = useState<string[]>([])
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [buildCommand, setBuildCommand] = useState("")
  const [installCommand, setInstallCommand] = useState("")
  const [outputDir, setOutputDir] = useState("")
  const [deploying, setDeploying] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const branchDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRepoDropdownOpen(false)
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false)
      }
    }
    if (repoDropdownOpen || branchDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [repoDropdownOpen, branchDropdownOpen])

  const fetchRepos = useCallback(async () => {
    setReposLoading(true)
    setReposError(null)
    try {
      const res = await fetch("/api/github/repos")
      if (!res.ok) throw new Error("Failed to fetch repositories")
      const data = await res.json()
      setRepos(data)
    } catch {
      setReposError("Could not load repositories")
    } finally {
      setReposLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && mode === "github" && repos.length === 0 && !reposLoading && !reposError) {
      fetchRepos()
    }
  }, [open, mode, repos.length, reposLoading, reposError, fetchRepos])

  const fetchBranches = useCallback(async (repoFullName: string, knownDefault?: string) => {
    setBranchesLoading(true)
    setBranches([])
    try {
      const res = await fetch(`/api/github/branches?repo=${encodeURIComponent(repoFullName)}`)
      if (res.ok) {
        const data = await res.json() as { branches: string[]; defaultBranch: string | null }
        setBranches(data.branches)
        // Use known default, then API default, then first branch
        const defaultName = knownDefault ?? data.defaultBranch
        if (defaultName && data.branches.includes(defaultName)) {
          setBranch(defaultName)
        } else if (data.branches.length > 0) {
          setBranch(data.branches[0])
        }
      }
    } catch { /* ignore */ } finally {
      setBranchesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setMode("github")
      setSelectedRepo(null)
      setPublicUrl("")
      setProjectName("")
      setBranch("")
      setBranches([])
      setBranchDropdownOpen(false)
      setBuildCommand("")
      setInstallCommand("")
      setOutputDir("")
      setRepoSearch("")
      setRepoDropdownOpen(false)
    }
  }, [open])

  const filteredRepos = repos.filter((r) => r.fullName.toLowerCase().includes(repoSearch.toLowerCase()))

  function selectRepo(repo: GitHubRepo) {
    setSelectedRepo(repo)
    setRepoDropdownOpen(false)
    setRepoSearch("")
    setProjectName(repo.name)
    setBranch(repo.defaultBranch)
    fetchBranches(repo.fullName, repo.defaultBranch)
  }

  function parsePublicUrl(url: string) {
    setPublicUrl(url)
    const match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/)?$/)
    if (match) {
      const repoFullName = `${match[1]}/${match[2]}`
      setProjectName(match[2])
      fetchBranches(repoFullName)
    }
  }

  const repoUrl = mode === "github" ? selectedRepo?.url ?? "" : publicUrl.replace(/\.git$/, "").replace(/\/$/, "")

  const canDeploy =
    projectName.length > 0 &&
    branch.length > 0 &&
    repoUrl.length > 0 &&
    /^[a-z0-9-]{1,64}$/.test(projectName)

  async function handleDeploy() {
    if (!canDeploy) return
    setDeploying(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          repo_url: repoUrl,
          branch,
          subdomain: projectName,
          ...(buildCommand && { build_command: buildCommand }),
          ...(installCommand && { install_command: installCommand }),
          ...(outputDir && { output_dir: outputDir }),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create project")
      }
      const project = (await res.json()) as Project
      const deploymentResponse = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id }),
      })
      if (!deploymentResponse.ok) {
        const data = await deploymentResponse.json().catch(() => ({}))
        throw new Error(data.error || "Project created, but deployment failed to start")
      }
      toast.success("Project created")
      onCreated()
      onOpenChange(false)
      router.push(`/projects/${project.name}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setDeploying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Import a repository to deploy.</DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4 pb-6">
          <div className="flex gap-1 rounded-md border p-0.5">
            <button
              onClick={() => setMode("github")}
              className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "github" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Repositories
            </button>
            <button
              onClick={() => setMode("public")}
              className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "public" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Public Repo
            </button>
          </div>

          {mode === "github" ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Repository</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
                  className="flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <span className={selectedRepo ? "text-foreground" : "text-muted-foreground"}>
                    {selectedRepo ? selectedRepo.fullName : "Select a repository..."}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </button>

                {repoDropdownOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full rounded-md border bg-popover shadow-md">
                    <div className="relative p-2">
                      <Search className="absolute left-4.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        className="h-8 w-full rounded-sm border bg-transparent pl-8 pr-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Search..."
                        value={repoSearch}
                        onChange={(e) => setRepoSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto border-t">
                      {reposLoading ? (
                        <div className="space-y-1 p-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                              <Skeleton className="h-4 w-4 rounded" />
                              <Skeleton className="h-3.5 flex-1" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          ))}
                        </div>
                      ) : reposError ? (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm text-muted-foreground">{reposError}</p>
                          <button onClick={fetchRepos} className="mt-2 text-xs text-primary hover:underline">
                            Retry
                          </button>
                        </div>
                      ) : filteredRepos.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No repositories found.</p>
                      ) : (
                        filteredRepos.map((repo) => (
                          <button
                            key={repo.fullName}
                            onClick={() => selectRepo(repo)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-accent"
                          >
                            <span className="min-w-0 flex-1 truncate font-medium">{repo.fullName}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{repo.language || "—"}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Repository URL</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="https://github.com/owner/repo" value={publicUrl} onChange={(e) => parsePublicUrl(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Project Name</label>
            <Input
              placeholder="my-project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Branch</label>
            <div className="relative" ref={branchDropdownRef}>
              <button
                type="button"
                onClick={() => branches.length > 0 && setBranchDropdownOpen(!branchDropdownOpen)}
                className="flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <span className="flex items-center gap-2">
                  {branchesLoading && <Loader2 className="size-3 animate-spin" />}
                  <GitBranch className="size-3 text-muted-foreground" />
                  <span className={branch ? "text-foreground" : "text-muted-foreground"}>
                    {branchesLoading ? "Loading..." : branch || "Select branch..."}
                  </span>
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>

              {branchDropdownOpen && branches.length > 0 && (
                <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full rounded-md border bg-popover shadow-md">
                  <div className="max-h-48 overflow-y-auto">
                    {branches.map((b) => (
                      <button
                        key={b}
                        onClick={() => { setBranch(b); setBranchDropdownOpen(false) }}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-accent ${
                          b === branch ? "bg-accent/50 font-medium" : ""
                        }`}
                      >
                        <GitBranch className="size-3 text-muted-foreground" />
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
              Build settings (optional)
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Build Command</label>
                  <Input className="h-8 text-xs" placeholder="npm run build" value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Install Command</label>
                  <Input className="h-8 text-xs" placeholder="npm install" value={installCommand} onChange={(e) => setInstallCommand(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Output Directory</label>
                <Input className="h-8 text-xs" placeholder=".next" value={outputDir} onChange={(e) => setOutputDir(e.target.value)} />
              </div>
            </div>
          </details>

          <Button className="w-full" disabled={!canDeploy || deploying} onClick={handleDeploy}>
            {deploying && <Loader2 className="size-3.5 animate-spin" />}
            Deploy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ProjectsPage() {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const projRes = await fetch("/api/projects")
      if (!projRes.ok) {
        const data = await projRes.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load projects")
      }
      const data = (await projRes.json()) as Project[]
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your deployed applications.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" />
          New Project
        </Button>
        <NewProjectDialog open={open} onOpenChange={setOpen} onCreated={() => void loadProjects()} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadProjects()}>
            Retry
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first project to connect the dashboard to the Rift engine.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <a
              key={project.id}
              href={`/projects/${project.name}`}
              className="group rounded-lg border p-5 transition-colors hover:bg-muted/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{project.framework}</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-success" />
                  configured
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="size-3" />
                  <span className="font-mono">{project.branch}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="size-3" />
                  <span>{project.public_url.replace(/^https?:\/\//, "")}</span>
                </div>
              </div>
              <p className="mt-3 truncate text-xs text-muted-foreground">{project.repo_url}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
