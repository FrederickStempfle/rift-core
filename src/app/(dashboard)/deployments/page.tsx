export default function DeploymentsPage() {
  const deployments = [
    { id: "dep_a3f8c21", project: "marketing-site", commit: "a3f8c21", message: "Update hero section", branch: "main", status: "ready", duration: "42s", time: "2 min ago" },
    { id: "dep_e7b4d09", project: "api-docs", commit: "e7b4d09", message: "Add auth endpoints docs", branch: "main", status: "building", duration: "—", time: "5 min ago" },
    { id: "dep_1c9e4f2", project: "marketing-site", commit: "1c9e4f2", message: "feat: new pricing page", branch: "feat/hero", status: "ready", duration: "38s", time: "1 hour ago" },
    { id: "dep_8d2a6b7", project: "dashboard-app", commit: "8d2a6b7", message: "Fix auth middleware", branch: "main", status: "failed", duration: "12s", time: "3 hours ago" },
    { id: "dep_f4c1e8a", project: "api-docs", commit: "f4c1e8a", message: "Fix typo in README", branch: "fix/typo", status: "ready", duration: "35s", time: "5 hours ago" },
    { id: "dep_c2d9b31", project: "marketing-site", commit: "c2d9b31", message: "Add blog section", branch: "main", status: "ready", duration: "44s", time: "1 day ago" },
  ]

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deployments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All deployments across your projects.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Project</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Commit</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Message</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Branch</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Duration</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-medium">{d.project}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{d.commit}</td>
                <td className="max-w-48 truncate px-4 py-2.5 text-muted-foreground">{d.message}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{d.branch}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={`size-1.5 rounded-full ${
                      d.status === "ready"
                        ? "bg-emerald-500"
                        : d.status === "building"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`} />
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{d.duration}</td>
                <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{d.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
