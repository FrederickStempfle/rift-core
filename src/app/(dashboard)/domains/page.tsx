import { Plus } from "lucide-react"

export default function DomainsPage() {
  const domains = [
    { domain: "marketing.yourdomain.com", project: "marketing-site", primary: true, ssl: "active" },
    { domain: "docs.yourdomain.com", project: "api-docs", primary: true, ssl: "active" },
    { domain: "app.yourdomain.com", project: "dashboard-app", primary: true, ssl: "active" },
    { domain: "www.acme.com", project: "marketing-site", primary: false, ssl: "provisioning" },
  ]

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Domains</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage custom domains for your projects.
          </p>
        </div>
        <button className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="size-3.5" />
          Add Domain
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Domain</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Project</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">SSL</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr key={d.domain} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs font-medium">{d.domain}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{d.project}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                  {d.primary ? "Primary" : "Custom"}
                </td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={`size-1.5 rounded-full ${
                      d.ssl === "active" ? "bg-emerald-500" : "bg-amber-500"
                    }`} />
                    {d.ssl}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
