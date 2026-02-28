"use client"

import { useState, useEffect, useCallback } from "react"
import { ShieldCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Domain = {
  id: string
  domain: string
  verified: boolean
  sslStatus: "pending" | "provisioning" | "active" | "failed"
}

const sslColor: Record<string, string> = {
  active: "bg-emerald-500",
  provisioning: "bg-amber-500",
  pending: "bg-muted-foreground",
  failed: "bg-red-500",
}

const sslLabel: Record<string, string> = {
  active: "DNS verified — active",
  provisioning: "DNS verified — active",
  pending: "Awaiting DNS verification",
  failed: "DNS verification failed",
}

export default function SSLPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDomains = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/domains")
      if (!res.ok) throw new Error("Failed to fetch domains")
      const data = await res.json()
      setDomains(data)
    } catch {
      setError("Could not load SSL data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Domain Status</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          DNS verification status for your domains. Verify your DNS records to activate routing.
        </p>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Domain</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">DNS Verified</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-2.5"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-2.5"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-4 py-2.5"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-2.5"><Skeleton className="h-4 w-36" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={fetchDomains} className="mt-2 text-xs text-primary hover:underline">
            Retry
          </button>
        </div>
      ) : domains.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <ShieldCheck className="size-5 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-sm font-medium">No certificates</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            SSL certificates will appear here once you add domains.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Domain</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">DNS Verified</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs font-medium">{d.domain}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {d.verified ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`size-1.5 rounded-full ${sslColor[d.sslStatus] ?? "bg-muted-foreground"}`} />
                      {d.sslStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {sslLabel[d.sslStatus] ?? "Unknown"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
