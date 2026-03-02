"use client"

import { useState } from "react"
import { Check, Copy, Cpu, Layers, Zap } from "lucide-react"
import { AnimatedPage } from "@/components/animated-page"

type ConfigRow = {
  env: string
  label: string
  description: string
  defaultValue: string
}

function EnvBadge({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className="group inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
    >
      {value}
      <span className="text-muted-foreground/40 transition-colors group-hover:text-primary/60">
        {copied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
      </span>
    </button>
  )
}

function ConfigCard({
  icon: Icon,
  title,
  description,
  rows,
  note,
}: {
  icon: React.ElementType
  title: string
  description: string
  rows: ConfigRow[]
  note?: string
}) {
  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-3.5">
        <div className="flex size-7 items-center justify-center rounded-md border bg-background">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {note && (
        <div className="border-b bg-amber-50/50 px-5 py-2.5 text-xs text-amber-700">
          {note}
        </div>
      )}
      <div className="divide-y">
        {rows.map((row) => (
          <div
            key={row.env}
            className="grid grid-cols-1 gap-2 px-5 py-3.5 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{row.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {row.description}
              </p>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <EnvBadge value={row.env} />
              <span className="text-xs text-muted-foreground">
                Default:{" "}
                <span className="font-mono text-foreground/80">{row.defaultValue}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const runtimeRows: ConfigRow[] = [
  {
    env: "RIFT_RUNTIME_MODE",
    label: "Runtime Mode",
    description:
      "'pool' keeps pre-warmed workers ready to serve cold starts instantly. 'process' spawns a new Deno process per deployment on demand (legacy).",
    defaultValue: "process",
  },
  {
    env: "RIFT_HEALTHCHECK_INTERVAL_MS",
    label: "Health Check Interval",
    description: "Milliseconds between readiness probes when waking a worker.",
    defaultValue: "200",
  },
  {
    env: "RIFT_HEALTHCHECK_ATTEMPTS",
    label: "Health Check Attempts",
    description: "Maximum probe attempts before declaring a worker failed to start.",
    defaultValue: "50",
  },
  {
    env: "RIFT_RESOURCE_ENFORCEMENT",
    label: "Resource Enforcement",
    description:
      "'strict' causes a worker to be killed on resource limit breach. 'best-effort' logs and continues.",
    defaultValue: "best-effort",
  },
]

const poolRows: ConfigRow[] = [
  {
    env: "RIFT_POOL_WARM_SIZE",
    label: "Warm Worker Count",
    description:
      "Number of idle Deno workers kept warmed up at all times. Higher values reduce cold start latency.",
    defaultValue: "3",
  },
  {
    env: "RIFT_POOL_MAX_ACTIVE",
    label: "Max Active Workers",
    description: "Hard cap on simultaneously active workers across all projects.",
    defaultValue: "50",
  },
  {
    env: "RIFT_WORKER_MEMORY_LIMIT_MB",
    label: "Worker Memory Limit",
    description: "Maximum RSS memory (MiB) a single worker process may consume.",
    defaultValue: "512",
  },
  {
    env: "RIFT_WORKER_CPU_QUOTA_US",
    label: "Worker CPU Quota",
    description:
      "CPU time (μs) allowed per 100 ms period per worker. 100000 = 1 core. Enforced via cgroup.",
    defaultValue: "100000",
  },
  {
    env: "RIFT_WORKER_MAX_PIDS",
    label: "Max PIDs per Worker",
    description: "Maximum number of processes/threads a worker may fork.",
    defaultValue: "64",
  },
  {
    env: "RIFT_WORKER_MAX_OPEN_FILES",
    label: "Max Open Files",
    description: "Maximum file descriptors available to a worker process.",
    defaultValue: "1024",
  },
  {
    env: "RIFT_WORKER_REQUEST_TIMEOUT_SECS",
    label: "Request Timeout",
    description: "Seconds until a worker request is aborted and a 504 is returned.",
    defaultValue: "30",
  },
  {
    env: "RIFT_WORKER_MAX_CONCURRENT_REQUESTS",
    label: "Max Concurrent Requests",
    description: "Maximum simultaneous requests routed to a single project's worker.",
    defaultValue: "100",
  },
  {
    env: "RIFT_WORKER_LOADER",
    label: "Worker Loader Path",
    description: "Path to the TypeScript file loaded by each pool worker on startup.",
    defaultValue: "(bundled)",
  },
]

const functionRows: ConfigRow[] = [
  {
    env: "RIFT_FUNCTION_MODE",
    label: "Function Execution Mode",
    description:
      "'isolate' runs functions in V8 isolates (fast, lower overhead). 'deno' spawns Deno subprocesses (stronger isolation).",
    defaultValue: "isolate",
  },
  {
    env: "RIFT_ISOLATE_MAX_CONCURRENT",
    label: "Max Concurrent Isolates",
    description: "Maximum V8 isolates that may run simultaneously (isolate mode only).",
    defaultValue: "50",
  },
  {
    env: "RIFT_ISOLATE_TIMEOUT_SECS",
    label: "Isolate Execution Timeout",
    description: "Seconds before a V8 isolate execution is forcibly terminated.",
    defaultValue: "30",
  },
  {
    env: "RIFT_ISOLATE_HEAP_LIMIT_MB",
    label: "Isolate Heap Limit",
    description: "Maximum V8 heap size (MiB) per isolate. Exceeding this triggers OOM termination.",
    defaultValue: "128",
  },
  {
    env: "RIFT_GLOBAL_DISPATCHER_PORT",
    label: "Function Dispatcher Port",
    description: "Local port used by the global Deno function dispatcher service.",
    defaultValue: "9999",
  },
]

const isolationRows: ConfigRow[] = [
  {
    env: "RIFT_SECCOMP_ENFORCE",
    label: "Enforce Seccomp BPF",
    description:
      "Apply a seccomp-BPF syscall filter to worker processes. Disable only if your kernel does not support it.",
    defaultValue: "true",
  },
  {
    env: "RIFT_NAMESPACE_ISOLATE",
    label: "Namespace Isolation",
    description:
      "Place workers in separate PID and mount namespaces for stronger isolation. Not available inside Docker.",
    defaultValue: "false",
  },
]

export default function RuntimeSettingsPage() {
  return (
    <AnimatedPage className="flex flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Runtime Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Worker pool, function execution, and process isolation configuration. Click any variable
          to copy it.
        </p>
      </div>

      <ConfigCard
        icon={Layers}
        title="Runtime Mode"
        description="How worker processes are created and managed."
        note="Changing RIFT_RUNTIME_MODE requires a full engine restart."
        rows={runtimeRows}
      />

      <ConfigCard
        icon={Cpu}
        title="Worker Pool"
        description="Pre-warmed pool size, resource limits, and concurrency caps per worker."
        note="Active when RIFT_RUNTIME_MODE=pool."
        rows={poolRows}
      />

      <ConfigCard
        icon={Zap}
        title="Function Execution"
        description="V8 isolate and Deno subprocess settings for serverless function invocations."
        rows={functionRows}
      />

      <ConfigCard
        icon={Cpu}
        title="Process Isolation"
        description="Kernel-level isolation mechanisms applied to each worker."
        rows={isolationRows}
      />
    </AnimatedPage>
  )
}
