"use client"

import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { AnimatedPage } from "@/components/animated-page"
import { useProjectContext } from "../context"

export default function ProjectLogsPage() {
  const { latestDeployment, latestDeploymentIsActive, logs, logsConnected } = useProjectContext()
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  return (
    <AnimatedPage className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-medium">Build Logs</p>
          <div className="flex items-center gap-2">
            {logsConnected && <span className="size-1.5 rounded-full bg-emerald-500" title="Live" />}
            {latestDeploymentIsActive && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            {latestDeployment && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {latestDeployment.commit_sha.slice(0, 7)}
              </span>
            )}
          </div>
        </div>

        <div className="max-h-[600px] overflow-auto bg-[#1a1625] p-4">
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6e6588]">No build logs available.</p>
          ) : (
            <div className="space-y-0.5 font-mono text-[13px] leading-6">
              {logs.map((log, i) => (
                <div key={log.id} className="flex">
                  <span className="mr-4 select-none text-right text-[#3d3555]" style={{ minWidth: "2.5ch" }}>
                    {i + 1}
                  </span>
                  <span className="mr-3 shrink-0 text-[#5a4f72]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span
                    className={
                      log.level === "error"
                        ? "text-red-400"
                        : log.level === "warn"
                          ? "text-amber-400"
                          : "text-[#d4cfde]"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </section>
    </AnimatedPage>
  )
}
