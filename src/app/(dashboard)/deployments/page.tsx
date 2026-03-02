"use client"

import { Activity, Clock, GitBranch, GitCommit, LayoutGrid, Rocket, TerminalSquare } from "lucide-react"
import { AnimatedPage } from "@/components/animated-page"
import { AnimatedList, AnimatedListItem } from "@/components/animated-list"
import { Badge } from "@/components/ui/badge"

export default function DeploymentsPage() {
  const deployments = [
    { id: "dep_a3f8c21", project: "marketing-site", commit: "a3f8c21", message: "Update hero section", branch: "main", status: "ready", duration: "42s", time: "2 min ago" },
    { id: "dep_e7b4d09", project: "api-docs", commit: "e7b4d09", message: "Add auth endpoints docs", branch: "main", status: "building", duration: "—", time: "5 min ago" },
    { id: "dep_1c9e4f2", project: "marketing-site", commit: "1c9e4f2", message: "feat: new pricing page", branch: "feat/hero", status: "ready", duration: "38s", time: "1 hour ago" },
    { id: "dep_8d2a6b7", project: "dashboard-app", commit: "8d2a6b7", message: "Fix auth middleware", branch: "main", status: "failed", duration: "12s", time: "3 hours ago" },
    { id: "dep_f4c1e8a", project: "api-docs", commit: "f4c1e8a", message: "Fix typo in README", branch: "fix/typo", status: "ready", duration: "35s", time: "5 hours ago" },
    { id: "dep_c2d9b31", project: "marketing-site", commit: "c2d9b31", message: "Add blog section", branch: "main", status: "ready", duration: "44s", time: "1 day ago" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "building":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
      case "building":
        return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
      case "failed":
        return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
      default:
        return "bg-muted-foreground"
    }
  }

  return (
    <AnimatedPage className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
            <Rocket className="size-6 text-primary" />
            Deployments
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
            Monitor and manage all your project deployments in real-time. View build logs, branch status, and performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md shadow-sm border">
            <Activity className="size-4 text-emerald-500" />
            <span className="text-xs font-medium">All systems operational</span>
          </div>
        </div>
      </div>

      <AnimatedList className="grid gap-4">
        {deployments.map((d) => (
          <AnimatedListItem key={d.id}>
            <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-surface/50 p-5 transition-all hover:bg-surface hover:shadow-md hover:border-primary/20">
              
              {/* Left Section: Project & Message */}
              <div className="flex items-start gap-4">
                <div className="relative mt-1 flex size-10 items-center justify-center rounded-lg bg-background border shadow-sm group-hover:scale-105 transition-transform">
                  <LayoutGrid className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className={`absolute -right-1 -top-1 size-3 rounded-full border-2 border-background ${getStatusDot(d.status)}`} />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {d.project}
                    </span>
                    <Badge variant="outline" className={`h-5 px-2 text-[10px] font-medium uppercase tracking-wider ${getStatusColor(d.status)}`}>
                      {d.status === "building" ? (
                        <span className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="size-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="size-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      ) : (
                        d.status
                      )}
                    </Badge>
                  </div>
                  
                  <p className="text-sm font-medium text-muted-foreground line-clamp-1">
                    {d.message}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/80 mt-2">
                    <span className="flex items-center gap-1.5 bg-background border px-2 py-0.5 rounded-md text-foreground/80">
                      <GitBranch className="size-3 text-primary/70" />
                      <span className="font-mono">{d.branch}</span>
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                      <GitCommit className="size-3" />
                      <span className="font-mono">{d.commit}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Section: Metadata & Actions */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pl-14 sm:pl-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 justify-end w-20">
                    <TerminalSquare className="size-3.5" />
                    <span>{d.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end w-24">
                    <Clock className="size-3.5" />
                    <span>{d.time}</span>
                  </div>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 sm:-mb-2 hidden sm:flex">
                   <button className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded transition-colors">
                     Logs
                   </button>
                   <button className="text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/10 px-2 py-1 rounded transition-colors">
                     View App
                   </button>
                </div>
              </div>

            </div>
          </AnimatedListItem>
        ))}
      </AnimatedList>
    </AnimatedPage>
  )
}
