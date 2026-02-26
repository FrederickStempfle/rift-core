import { GitBranch, Globe, Plus } from "lucide-react"

export default function ProjectsPage() {
  const projects = [
    {
      name: "marketing-site",
      framework: "Next.js",
      branch: "main",
      subdomain: "marketing",
      status: "active",
      lastDeploy: "2 min ago",
    },
    {
      name: "api-docs",
      framework: "Vite",
      branch: "main",
      subdomain: "docs",
      status: "building",
      lastDeploy: "5 min ago",
    },
    {
      name: "dashboard-app",
      framework: "Next.js",
      branch: "main",
      subdomain: "app",
      status: "failed",
      lastDeploy: "3 hours ago",
    },
  ]

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your deployed applications.
          </p>
        </div>
        <a
          href="/projects/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-[#6D28D9] transition-colors"
        >
          <Plus className="size-3.5" />
          New Project
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <a
            key={p.name}
            href={`/projects/${p.name}`}
            className="group rounded-lg border bg-surface p-5 transition-colors hover:bg-[#EDE9FE]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{p.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.framework}
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-1.5 rounded-full ${
                  p.status === "active"
                    ? "bg-success"
                    : p.status === "building"
                      ? "bg-warning"
                      : "bg-destructive"
                }`} />
                {p.status}
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <GitBranch className="size-3" />
                <span className="font-mono">{p.branch}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="size-3" />
                <span>{p.subdomain}.yourdomain.com</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Deployed {p.lastDeploy}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
