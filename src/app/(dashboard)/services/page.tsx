"use client"

import { useState } from "react"
import { BarChart3, Blocks, Database, FileText, Loader2, Plus, Workflow } from "lucide-react"
import { useRouter } from "next/navigation"
import { useServices, type Service } from "@/hooks/use-services"
import { AnimatedPage } from "@/components/animated-page"
import { AnimatedList, AnimatedListItem } from "@/components/animated-list"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  running: { dot: "bg-emerald-500", label: "Running" },
  deploying: { dot: "bg-amber-500 animate-pulse", label: "Deploying" },
  pending: { dot: "bg-amber-500 animate-pulse", label: "Pending" },
  stopped: { dot: "bg-gray-400", label: "Stopped" },
  failed: { dot: "bg-red-500", label: "Failed" },
  removing: { dot: "bg-gray-400 animate-pulse", label: "Removing" },
}

const SERVICE_CATALOG = [
  {
    type: "supabase",
    name: "Supabase",
    description: "Open-source Firebase alternative. Includes PostgreSQL, Auth, REST API, Realtime, Storage, and Studio dashboard.",
    icon: Database,
    iconColor: "text-emerald-600",
  },
  {
    type: "posthog",
    name: "PostHog",
    description: "Open-source product analytics. Track events, funnels, session recordings, and feature flags.",
    icon: BarChart3,
    iconColor: "text-blue-600",
  },
  {
    type: "n8n",
    name: "n8n",
    description: "Workflow automation platform. Build complex automations with a visual editor and 400+ integrations.",
    icon: Workflow,
    iconColor: "text-orange-600",
  },
  {
    type: "affine",
    name: "AFFiNE",
    description: "Open-source knowledge base. Write, draw, and plan with AI-powered docs, whiteboards, and databases.",
    icon: FileText,
    iconColor: "text-violet-600",
  },
] as const

function getServiceIcon(serviceType: string) {
  const entry = SERVICE_CATALOG.find((s) => s.type === serviceType)
  if (entry) return { Icon: entry.icon, color: entry.iconColor }
  return { Icon: Blocks, color: "text-muted-foreground" }
}

function DeployServiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [deploying, setDeploying] = useState<string | null>(null)

  async function handleDeploy(serviceType: string, serviceName: string) {
    setDeploying(serviceType)
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_type: serviceType }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Failed to deploy service")
      }

      toast.success(`${serviceName} deployment started`)
      onOpenChange(false)
      router.push(`/services/${data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to deploy service")
    } finally {
      setDeploying(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Deploy Service</DialogTitle>
          <DialogDescription>
            Choose a service to deploy on your Rift instance.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
          {SERVICE_CATALOG.map((svc) => {
            const Icon = svc.icon
            const isDeploying = deploying === svc.type
            return (
              <button
                key={svc.type}
                onClick={() => handleDeploy(svc.type, svc.name)}
                disabled={deploying !== null}
                className="flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                  <Icon className={`size-5 ${svc.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{svc.name}</span>
                    {isDeploying && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {svc.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ServiceCard({ service }: { service: Service }) {
  const router = useRouter()
  const style = STATUS_STYLES[service.status] ?? STATUS_STYLES.stopped
  const { Icon, color } = getServiceIcon(service.service_type)

  return (
    <button
      onClick={() => router.push(`/services/${service.id}`)}
      className="flex flex-col gap-3 rounded-lg border p-5 text-left transition-colors hover:bg-muted/60"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg border bg-background">
          <Icon className={`size-4 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{service.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{service.service_type}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${style.dot}`} />
          <span className="text-xs text-muted-foreground">{style.label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {new Date(service.created_at).toLocaleDateString()}
        </span>
      </div>
    </button>
  )
}

export default function ServicesPage() {
  const { services, error, isLoading, mutate } = useServices()
  const [deployOpen, setDeployOpen] = useState(false)

  return (
    <AnimatedPage className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deploy and manage infrastructure services for your projects.
          </p>
        </div>
        <Button size="sm" onClick={() => setDeployOpen(true)}>
          <Plus className="size-3.5" />
          Deploy Service
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
            Retry
          </Button>
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Blocks className="mx-auto size-10 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">No services yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Deploy a service like Supabase to get started with databases, auth, and more.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setDeployOpen(true)}>
            <Plus className="size-3.5" />
            Deploy Service
          </Button>
        </div>
      ) : (
        <AnimatedList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <AnimatedListItem key={service.id}>
              <ServiceCard service={service} />
            </AnimatedListItem>
          ))}
        </AnimatedList>
      )}

      <DeployServiceDialog
        open={deployOpen}
        onOpenChange={(open) => {
          setDeployOpen(open)
          if (!open) mutate()
        }}
      />
    </AnimatedPage>
  )
}
