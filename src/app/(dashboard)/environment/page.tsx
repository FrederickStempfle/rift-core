import { Plus } from "lucide-react"

export default function EnvironmentPage() {
  const envVars = [
    { key: "DATABASE_URL", project: "dashboard-app", preview: "postgres://****" },
    { key: "NEXT_PUBLIC_API_URL", project: "marketing-site", preview: "https://api.acme.com" },
    { key: "STRIPE_SECRET_KEY", project: "dashboard-app", preview: "sk_live_****" },
    { key: "RESEND_API_KEY", project: "api-docs", preview: "re_****" },
    { key: "JWT_SECRET", project: "dashboard-app", preview: "••••••••" },
  ]

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Environment Variables
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Encrypted variables injected into your deployments at runtime.
          </p>
        </div>
        <button className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="size-3.5" />
          Add Variable
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Key</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Value</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Project</th>
            </tr>
          </thead>
          <tbody>
            {envVars.map((v) => (
              <tr key={v.key} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs font-medium">{v.key}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{v.preview}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.project}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
