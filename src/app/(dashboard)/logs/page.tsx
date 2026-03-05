import { AnimatedPage } from "@/components/animated-page"

export default function LogsPage() {
  const logs = [
    { time: "14:32:05", level: "info", source: "build", message: "Cloning repository acme/marketing-site...", deployment: "dep_a3f8c21" },
    { time: "14:32:08", level: "info", source: "build", message: "Installing dependencies (npm install)...", deployment: "dep_a3f8c21" },
    { time: "14:32:22", level: "info", source: "build", message: "Running build command (npm run build)...", deployment: "dep_a3f8c21" },
    { time: "14:32:38", level: "info", source: "build", message: "Build completed in 33s", deployment: "dep_a3f8c21" },
    { time: "14:32:39", level: "info", source: "runtime", message: "Spawning Deno process on port 4001", deployment: "dep_a3f8c21" },
    { time: "14:32:39", level: "info", source: "runtime", message: "Health check passed — routing traffic", deployment: "dep_a3f8c21" },
    { time: "14:30:12", level: "error", source: "build", message: "Build failed: Module not found '@/lib/db'", deployment: "dep_8d2a6b7" },
    { time: "14:25:01", level: "warn", source: "runtime", message: "Process idle for 5m — suspending", deployment: "dep_f4c1e8a" },
  ]

  return (
    <AnimatedPage className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build and runtime logs across all deployments.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-[--sidebar] font-mono text-xs">
        <div className="border-b bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground font-sans">
          <span className="mr-6 inline-block w-14">Time</span>
          <span className="mr-6 inline-block w-10">Level</span>
          <span className="mr-6 inline-block w-12">Source</span>
          <span>Message</span>
        </div>
        <div className="divide-y divide-border/50">
          {logs.map((l, i) => (
            <div key={i} className="flex items-start gap-0 px-4 py-1.5">
              <span className="mr-6 inline-block w-14 shrink-0 text-muted-foreground">
                {l.time}
              </span>
              <span className={`mr-6 inline-block w-10 shrink-0 ${
                l.level === "error"
                  ? "text-red-500"
                  : l.level === "warn"
                    ? "text-amber-500"
                    : "text-muted-foreground"
              }`}>
                {l.level}
              </span>
              <span className="mr-6 inline-block w-12 shrink-0 text-muted-foreground">
                {l.source}
              </span>
              <span className={
                l.level === "error"
                  ? "text-red-400"
                  : l.level === "warn"
                    ? "text-amber-400"
                    : ""
              }>
                {l.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AnimatedPage>
  )
}
