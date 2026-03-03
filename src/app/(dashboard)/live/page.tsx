"use client"

import dynamic from "next/dynamic"
import { Activity, Clock, MapPin, Wifi, WifiOff } from "lucide-react"
import { useLiveTraffic } from "@/hooks/use-live-traffic"

// Globe is heavy (WebGL + canvas) — load client-only
const Globe = dynamic(() => import("@/components/globe"), { ssr: false })

function statusBadge(status: number) {
  if (status >= 500)
    return <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-red-500/15 text-red-400">{status}</span>
  if (status >= 400)
    return <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-orange-500/15 text-orange-400">{status}</span>
  if (status >= 300)
    return <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-blue-500/15 text-blue-400">{status}</span>
  return <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400">{status}</span>
}

export default function LiveTrafficPage() {
  const { arcs, events, connected, totalRequests } = useLiveTraffic()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live Traffic</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time requests streamed from visitors to your server.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {connected ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Wifi className="size-3.5" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <WifiOff className="size-3.5" />
              Connecting…
            </span>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="size-4" />
            <span className="text-xs font-medium">Requests this session</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{totalRequests.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" />
            <span className="text-xs font-medium">Unique origins</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {new Set(events.map((e) => e.country ?? e.host ?? "?")).size}
          </p>
        </div>
        <div className="hidden rounded-lg border bg-card p-4 sm:block">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            <span className="text-xs font-medium">Avg duration</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {events.length === 0
              ? "—"
              : `${Math.round(events.reduce((s, e) => s + e.duration_ms, 0) / events.length)} ms`}
          </p>
        </div>
      </div>

      {/* Globe + feed */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Globe */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-200 dark:bg-white">
          <div className="flex items-center justify-center px-3 pt-3">
            <Globe
              className="w-full max-w-[540px]"
              arcs={arcs}
            />
          </div>
          <p className="px-4 pb-3 text-center text-[11px] text-slate-500">
            Drag to rotate. Scroll to zoom.
          </p>
        </div>

        {/* Live feed */}
        <div className="flex flex-col rounded-xl border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Recent Requests</h2>
          </div>
          <div className="flex flex-1 flex-col divide-y overflow-hidden">
            {events.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                <Activity className="size-8 opacity-30" />
                <p className="text-sm">Waiting for traffic…</p>
              </div>
            ) : (
              events.map((ev, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 shrink-0">
                    {statusBadge(ev.status)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{ev.method}</span>
                      <span className="truncate text-xs font-medium">{ev.host ?? "—"}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      {ev.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-2.5" />
                          {ev.country}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="size-2.5" />
                        {ev.duration_ms} ms
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
