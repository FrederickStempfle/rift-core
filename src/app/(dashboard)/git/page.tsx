import { AnimatedPage } from "@/components/animated-page"

export default function GitPage() {
  const repos = [
    { name: "acme/marketing-site", branch: "main", lastPush: "2 min ago", webhookActive: true },
    { name: "acme/api-docs", branch: "main", lastPush: "5 min ago", webhookActive: true },
    { name: "acme/dashboard", branch: "main", lastPush: "3 hours ago", webhookActive: true },
  ]

  return (
    <AnimatedPage className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Git</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connected repositories and webhook status.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Repository</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Branch</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Last Push</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Webhook</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((r) => (
              <tr key={r.name} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs font-medium">{r.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.branch}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.lastPush}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={`size-1.5 rounded-full ${
                      r.webhookActive ? "bg-emerald-500" : "bg-red-500"
                    }`} />
                    {r.webhookActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AnimatedPage>
  )
}
