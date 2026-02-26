import { Activity, FolderGit2, Rocket, Timer } from "lucide-react"

export default function Home() {
  const stats = [
    { label: "Projects", value: "3", icon: FolderGit2, sub: "2 active" },
    { label: "Deployments", value: "12", icon: Rocket, sub: "1 building" },
    { label: "Uptime", value: "99.9%", icon: Activity, sub: "Last 30 days" },
    { label: "Avg. Cold Start", value: "240ms", icon: Timer, sub: "Last 24h" },
  ]

  const recentDeploys = [
    { project: "marketing-site", branch: "main", commit: "a3f8c21", status: "ready", time: "2 min ago" },
    { project: "api-docs", branch: "main", commit: "e7b4d09", status: "building", time: "5 min ago" },
    { project: "marketing-site", branch: "feat/hero", commit: "1c9e4f2", status: "ready", time: "1 hour ago" },
    { project: "dashboard-app", branch: "main", commit: "8d2a6b7", status: "failed", time: "3 hours ago" },
    { project: "api-docs", branch: "fix/typo", commit: "f4c1e8a", status: "ready", time: "5 hours ago" },
  ]

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your deployments and projects.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className="size-4 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Recent Deployments
        </h2>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Branch</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Commit</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentDeploys.map((d, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">{d.project}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{d.branch}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{d.commit}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`size-1.5 rounded-full ${
                        d.status === "ready"
                          ? "bg-success"
                          : d.status === "building"
                            ? "bg-warning"
                            : "bg-destructive"
                      }`} />
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {d.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
