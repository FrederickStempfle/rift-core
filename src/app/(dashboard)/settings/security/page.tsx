"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { AnimatedPage } from "@/components/animated-page"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WafMode = "active" | "log_only" | "disabled"

type WafPolicy = {
  mode: WafMode
  failOpen: boolean
}

type WafRule = {
  id: string
  projectId: string | null
  name: string
  description: string
  matchField: string
  matchOp: string
  matchValue: string
  headerName: string | null
  action: string
  priority: number
  enabled: boolean
  isManaged: boolean
  createdAt: string
}

type ConfigRow = {
  env: string
  label: string
  description: string
  defaultValue: string
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function EnvBadge({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="group inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
    >
      {value}
      <span className="text-muted-foreground/40 transition-colors group-hover:text-primary/60">
        {copied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
      </span>
    </button>
  )
}

function EnvRefCard({
  icon: Icon,
  title,
  description,
  rows,
}: {
  icon: React.ElementType
  title: string
  description: string
  rows: ConfigRow[]
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
                Default: <span className="font-mono text-foreground/80">{row.defaultValue}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// WAF Policy section
// ---------------------------------------------------------------------------

const MODE_OPTIONS: { value: WafMode; label: string; description: string }[] = [
  {
    value: "active",
    label: "Active",
    description: "Rules are enforced — matching requests are blocked or challenged.",
  },
  {
    value: "log_only",
    label: "Log Only",
    description: "Rules are evaluated and logged, but no requests are blocked.",
  },
  {
    value: "disabled",
    label: "Disabled",
    description: "WAF is bypassed entirely. All requests pass through unfiltered.",
  },
]

function WafPolicySection() {
  const { data, mutate, isLoading } = useSWR<WafPolicy>("/api/waf/policy")
  const [saving, setSaving] = useState(false)

  const policy: WafPolicy = data ?? { mode: "active", failOpen: true }

  async function setMode(mode: WafMode) {
    setSaving(true)
    try {
      const res = await fetch("/api/waf/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, failOpen: policy.failOpen }),
      })
      if (res.ok) {
        mutate()
        toast.success(`WAF mode set to ${mode}`)
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || "Failed to update WAF policy")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function toggleFailOpen(failOpen: boolean) {
    setSaving(true)
    try {
      const res = await fetch("/api/waf/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: policy.mode, failOpen }),
      })
      if (res.ok) {
        mutate()
        toast.success(failOpen ? "Fail-open enabled" : "Fail-open disabled")
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || "Failed to update WAF policy")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const modeIcon = {
    active: ShieldCheck,
    log_only: Shield,
    disabled: ShieldOff,
  }[policy.mode] ?? Shield

  const modeColor = {
    active: "text-emerald-600",
    log_only: "text-amber-600",
    disabled: "text-muted-foreground",
  }[policy.mode]

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-3.5">
        <div className="flex size-7 items-center justify-center rounded-md border bg-background">
          <ShieldAlert className="size-3.5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Global WAF Policy</h2>
          <p className="text-xs text-muted-foreground">
            Controls how WAF rules are enforced across all projects.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-5 py-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : (
        <div className="divide-y">
          {/* Mode selector */}
          <div className="px-5 py-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Enforcement Mode
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {MODE_OPTIONS.map((opt) => {
                const Icon = {
                  active: ShieldCheck,
                  log_only: Shield,
                  disabled: ShieldOff,
                }[opt.value]

                const isSelected = policy.mode === opt.value
                return (
                  <button
                    key={opt.value}
                    disabled={saving}
                    onClick={() => setMode(opt.value)}
                    className={`flex flex-col gap-1.5 rounded-lg border p-3.5 text-left transition-colors ${
                      isSelected
                        ? opt.value === "active"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : opt.value === "log_only"
                          ? "border-amber-300 bg-amber-50 text-amber-800"
                          : "border-red-200 bg-red-50 text-red-800"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="size-3.5" />
                      <span className="text-sm font-medium">{opt.label}</span>
                      {isSelected && saving && (
                        <Loader2 className="ml-auto size-3 animate-spin" />
                      )}
                    </div>
                    <p className="text-xs leading-snug opacity-80">{opt.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fail-open */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium">Fail Open</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                If the WAF engine errors, allow the request through rather than returning 500. Recommended.
              </p>
            </div>
            <Switch
              checked={policy.failOpen}
              onCheckedChange={toggleFailOpen}
              disabled={saving}
            />
          </div>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Managed rules reference
// ---------------------------------------------------------------------------

const MANAGED_RULES = [
  { name: "Path Traversal", priority: 10, field: "path", op: "contains", value: "../", action: "block" },
  { name: "Encoded Path Traversal", priority: 10, field: "path", op: "contains", value: "%2e%2e", action: "block" },
  { name: "SQLi Basic", priority: 15, field: "query", op: "regex", value: "union.*select|drop.*table", action: "block" },
  { name: "XSS Script Tag", priority: 15, field: "query", op: "contains", value: "<script>", action: "block" },
  { name: "Sensitive .env", priority: 20, field: "path", op: "contains", value: ".env", action: "block" },
  { name: "Git Config", priority: 20, field: "path", op: "prefix", value: "/.git/", action: "block" },
  { name: "AWS Credentials", priority: 20, field: "path", op: "prefix", value: "/.aws/", action: "block" },
  { name: "SSH Keys", priority: 20, field: "path", op: "prefix", value: "/.ssh/", action: "block" },
  { name: "WP Login", priority: 30, field: "path", op: "exact", value: "/wp-login.php", action: "block" },
  { name: "XML-RPC", priority: 30, field: "path", op: "exact", value: "/xmlrpc.php", action: "block" },
  { name: "WP Admin", priority: 30, field: "path", op: "prefix", value: "/wp-admin/", action: "block" },
  { name: "WP Includes", priority: 30, field: "path", op: "prefix", value: "/wp-includes/", action: "block" },
  { name: "WP Content", priority: 30, field: "path", op: "prefix", value: "/wp-content/", action: "block" },
  { name: "phpMyAdmin", priority: 40, field: "path", op: "prefix", value: "/phpmyadmin", action: "block" },
  { name: "CGI Bin", priority: 40, field: "path", op: "prefix", value: "/cgi-bin/", action: "block" },
  { name: "PHPUnit", priority: 40, field: "path", op: "prefix", value: "/vendor/phpunit/", action: "block" },
  { name: "Boa Router", priority: 40, field: "path", op: "prefix", value: "/boaform/", action: "block" },
] as const

function ManagedRulesSection() {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? MANAGED_RULES : MANAGED_RULES.slice(0, 5)

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-3.5">
        <div className="flex size-7 items-center justify-center rounded-md border bg-background">
          <ShieldCheck className="size-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold">Managed Rules</h2>
          <p className="text-xs text-muted-foreground">
            Built-in rules maintained by Rift. Always enforced when WAF is active.
          </p>
        </div>
        <span className="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {MANAGED_RULES.length} rules
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Field</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Match</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Priority</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((rule) => (
              <tr key={rule.name} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2.5 font-medium">{rule.name}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{rule.field}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">{rule.op}</span>{" "}
                  <span className="font-mono text-xs">{rule.value}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                    Block
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                  {rule.priority}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {MANAGED_RULES.length > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 border-t py-2.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
        >
          <ChevronDown
            className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Show less" : `Show ${MANAGED_RULES.length - 5} more`}
        </button>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Custom WAF rules section
// ---------------------------------------------------------------------------

const MATCH_FIELDS = ["ip", "method", "host", "path", "query", "user_agent", "header"] as const
const MATCH_OPS = ["exact", "prefix", "contains", "regex", "cidr"] as const
const ACTIONS = ["allow", "challenge", "block", "log"] as const

type MatchField = (typeof MATCH_FIELDS)[number]
type MatchOp = (typeof MATCH_OPS)[number]
type Action = (typeof ACTIONS)[number]

const ACTION_COLORS: Record<Action, string> = {
  allow: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  challenge: "bg-amber-50 text-amber-700 ring-amber-600/20",
  block: "bg-red-50 text-red-700 ring-red-600/20",
  log: "bg-blue-50 text-blue-700 ring-blue-600/20",
}

function CustomRulesSection() {
  const { data, mutate, isLoading } = useSWR<WafRule[]>("/api/waf")
  const rules = (data ?? []).filter((r) => !r.isManaged)

  const [addOpen, setAddOpen] = useState(false)

  async function handleDelete(ruleId: string) {
    try {
      const res = await fetch(`/api/waf?ruleId=${encodeURIComponent(ruleId)}`, {
        method: "DELETE",
      })
      if (res.ok || res.status === 204) {
        toast.success("Rule deleted")
        mutate()
      } else {
        toast.error("Failed to delete rule")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function handleToggle(rule: WafRule) {
    try {
      const res = await fetch(`/api/waf?ruleId=${encodeURIComponent(rule.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rule.name,
          description: rule.description,
          matchField: rule.matchField,
          matchOp: rule.matchOp,
          matchValue: rule.matchValue,
          headerName: rule.headerName,
          action: rule.action,
          priority: rule.priority,
          enabled: !rule.enabled,
        }),
      })
      if (res.ok) {
        mutate()
        toast.success(rule.enabled ? "Rule disabled" : "Rule enabled")
      } else {
        toast.error("Failed to update rule")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-md border bg-background">
            <Shield className="size-3.5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Custom WAF Rules</h2>
            <p className="text-xs text-muted-foreground">
              Global rules applied to all projects. Higher priority = evaluated first.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />
          Add Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <div className="flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Shield className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">No custom rules</p>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            Add rules to block or challenge requests based on IP, path, headers, and more.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Match
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Action
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                  Priority
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rules
                .sort((a, b) => a.priority - b.priority)
                .map((rule) => (
                  <tr
                    key={rule.id}
                    className={`border-b last:border-0 hover:bg-muted/20 ${!rule.enabled ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{rule.name}</p>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {rule.matchField}
                      </span>{" "}
                      <span className="text-xs text-muted-foreground">{rule.matchOp}</span>{" "}
                      <span className="font-mono text-xs">{rule.matchValue}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${ACTION_COLORS[rule.action as Action] ?? ""}`}
                      >
                        {rule.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                      {rule.priority}
                    </td>
                    <td className="px-4 py-2.5">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => handleToggle(rule)}
                        className="scale-75"
                      />
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <AddRuleDialog open={addOpen} onOpenChange={setAddOpen} onCreated={() => mutate()} />
    </section>
  )
}

function AddRuleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [matchField, setMatchField] = useState<MatchField>("path")
  const [matchOp, setMatchOp] = useState<MatchOp>("prefix")
  const [matchValue, setMatchValue] = useState("")
  const [headerName, setHeaderName] = useState("")
  const [action, setAction] = useState<Action>("block")
  const [priority, setPriority] = useState("100")
  const [creating, setCreating] = useState(false)

  function resetForm() {
    setName("")
    setDescription("")
    setMatchField("path")
    setMatchOp("prefix")
    setMatchValue("")
    setHeaderName("")
    setAction("block")
    setPriority("100")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !matchValue.trim()) return

    setCreating(true)
    try {
      const res = await fetch("/api/waf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          matchField,
          matchOp,
          matchValue: matchValue.trim(),
          headerName: matchField === "header" ? headerName.trim() : null,
          action,
          priority: parseInt(priority) || 100,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "Failed to create rule")
      }
      toast.success("WAF rule created")
      onOpenChange(false)
      onCreated()
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setCreating(false)
    }
  }

  const selectClass =
    "h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Add WAF Rule</DialogTitle>
          <DialogDescription>
            Create a global rule evaluated against all incoming requests.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Rule Name</label>
            <Input
              placeholder="e.g. Block PHP scanners"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Match field + op */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Match Field</label>
              <select
                className={selectClass}
                value={matchField}
                onChange={(e) => setMatchField(e.target.value as MatchField)}
              >
                {MATCH_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Operator</label>
              <select
                className={selectClass}
                value={matchOp}
                onChange={(e) => setMatchOp(e.target.value as MatchOp)}
              >
                {MATCH_OPS.filter((op) =>
                  matchField === "ip" ? op !== "prefix" && op !== "contains" : op !== "cidr"
                ).map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Header name (conditional) */}
          {matchField === "header" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Header Name</label>
              <Input
                placeholder="e.g. x-api-key"
                value={headerName}
                onChange={(e) => setHeaderName(e.target.value)}
              />
            </div>
          )}

          {/* Match value */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Match Value</label>
            <Input
              placeholder={
                matchField === "ip"
                  ? "192.168.1.0/24 or 10.0.0.1"
                  : matchField === "path"
                  ? "/admin/"
                  : "value to match"
              }
              value={matchValue}
              onChange={(e) => setMatchValue(e.target.value)}
              className={matchField === "ip" ? "font-mono" : ""}
            />
          </div>

          {/* Action + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Action</label>
              <div className="grid grid-cols-2 gap-1.5">
                {ACTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAction(a)}
                    className={`rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                      action === a
                        ? a === "allow"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : a === "block"
                          ? "border-red-300 bg-red-50 text-red-700"
                          : a === "challenge"
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Priority{" "}
                <span className="text-muted-foreground/60">(lower = first)</span>
              </label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Description <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <Input
              placeholder="e.g. Block common PHP vulnerability scanners"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!name.trim() || !matchValue.trim() || creating}
            >
              {creating && <Loader2 className="size-3.5 animate-spin" />}
              Create Rule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Env var reference sections
// ---------------------------------------------------------------------------

const abuseRows: ConfigRow[] = [
  {
    env: "RIFT_ABUSE_BAN_TIER1_SECS",
    label: "Tier 1 Ban Duration",
    description: "Seconds a tier-1 offender is banned. Triggered by first threshold breach.",
    defaultValue: "60",
  },
  {
    env: "RIFT_ABUSE_BAN_TIER2_SECS",
    label: "Tier 2 Ban Duration",
    description: "Seconds for a tier-2 ban. Triggered when a tier-1 ban is evaded.",
    defaultValue: "300",
  },
  {
    env: "RIFT_ABUSE_BAN_TIER3_SECS",
    label: "Tier 3 Ban Duration",
    description: "Seconds for a tier-3 ban. Triggered for persistent offenders.",
    defaultValue: "1800",
  },
  {
    env: "RIFT_ABUSE_CHALLENGE_TTL_SECS",
    label: "Challenge Cookie Lifetime",
    description: "Seconds before a solved challenge cookie expires and re-verification is needed.",
    defaultValue: "900",
  },
  {
    env: "RIFT_ABUSE_CHALLENGE_MIN_SOLVE_SECS",
    label: "Min Challenge Solve Time",
    description: "Minimum seconds allowed to solve a challenge. Solving too fast signals automation.",
    defaultValue: "2",
  },
  {
    env: "RIFT_ABUSE_MAX_RETRY_AFTER_SECS",
    label: "Max Retry-After",
    description: "Cap on the Retry-After header value returned in 429 responses.",
    defaultValue: "600",
  },
  {
    env: "RIFT_ABUSE_ALLOWLIST_CIDRS",
    label: "Allowlisted CIDRs",
    description: "Comma-separated CIDR ranges that bypass all abuse controls.",
    defaultValue: "(none)",
  },
  {
    env: "RIFT_ABUSE_BYPASS_TOKEN",
    label: "Bypass Token",
    description: "Secret token that, when sent in the bypass header, skips abuse checks.",
    defaultValue: "(none)",
  },
  {
    env: "RIFT_ABUSE_TURNSTILE_SITE_KEY",
    label: "Turnstile Site Key",
    description: "Cloudflare Turnstile site key used to render the CAPTCHA challenge widget.",
    defaultValue: "(none)",
  },
  {
    env: "RIFT_ABUSE_TURNSTILE_SECRET_KEY",
    label: "Turnstile Secret Key",
    description: "Cloudflare Turnstile secret key used to verify solved challenges server-side.",
    defaultValue: "(none)",
  },
]

const botRows: ConfigRow[] = [
  {
    env: "RIFT_ACCESS_BOT_MODE",
    label: "Bot Detection Mode",
    description: "'off' disables detection. 'challenge' issues a CAPTCHA. 'block' returns 403.",
    defaultValue: "challenge",
  },
  {
    env: "RIFT_ACCESS_BOT_WINDOW_SECS",
    label: "Detection Window",
    description: "Seconds over which request metrics are collected to detect bot behaviour.",
    defaultValue: "30",
  },
  {
    env: "RIFT_ACCESS_BOT_BURST_THRESHOLD",
    label: "Burst Request Threshold",
    description: "Number of requests within the window that triggers bot detection.",
    defaultValue: "300",
  },
  {
    env: "RIFT_ACCESS_BOT_SCAN_UNIQUE_PATHS",
    label: "Unique Path Threshold",
    description: "Distinct URL paths hit within the window that signals a scanner.",
    defaultValue: "80",
  },
  {
    env: "RIFT_ACCESS_BOT_SCAN_404_THRESHOLD",
    label: "404 Response Threshold",
    description: "Number of 404 responses within the window that indicates directory probing.",
    defaultValue: "40",
  },
  {
    env: "RIFT_ACCESS_BOT_MITIGATION_SECS",
    label: "Mitigation Duration",
    description: "Seconds a detected bot IP is subjected to mitigation (challenge or block).",
    defaultValue: "300",
  },
  {
    env: "RIFT_ABUSE_BOT_VERIFY",
    label: "Crawler Verification",
    description: "Verify that bots claiming to be Googlebot/Bingbot are genuine via rDNS.",
    defaultValue: "true",
  },
  {
    env: "RIFT_ABUSE_BOT_VERIFY_CACHE_SECS",
    label: "Verification Cache TTL",
    description: "Seconds to cache rDNS verification results for a given IP.",
    defaultValue: "600",
  },
]

const honeypotRows: ConfigRow[] = [
  {
    env: "RIFT_HONEYPOT_ROBOTS_ENABLED",
    label: "Synthetic robots.txt",
    description: "Serve a robots.txt listing honeypot paths. Bots that ignore Disallow will be caught.",
    defaultValue: "false",
  },
  {
    env: "RIFT_HONEYPOT_PATHS",
    label: "Honeypot Paths",
    description: "Comma-separated URL paths listed as Disallow in robots.txt. Visiting triggers mitigation.",
    defaultValue: "/admin,/wp-admin,/.env",
  },
  {
    env: "RIFT_HONEYPOT_MODE",
    label: "Honeypot Response Mode",
    description: "'ban' adds to ban list. 'challenge' issues CAPTCHA. 'block' returns 403.",
    defaultValue: "ban",
  },
  {
    env: "RIFT_HONEYPOT_BAN_WINDOW_SECS",
    label: "Honeypot Ban Window",
    description: "Duration (seconds) a honeypot-triggered ban remains active.",
    defaultValue: "3600",
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SecuritySettingsPage() {
  return (
    <AnimatedPage className="flex flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Web Application Firewall, abuse protection, and bot detection configuration.
        </p>
      </div>

      <WafPolicySection />
      <ManagedRulesSection />
      <CustomRulesSection />

      <EnvRefCard
        icon={ShieldAlert}
        title="Abuse Protection"
        description="IP-level banning tiers, challenge settings, and bypass configuration. Set via environment variables."
        rows={abuseRows}
      />

      <EnvRefCard
        icon={Bot}
        title="Bot Detection"
        description="Heuristic thresholds for detecting automated scanners and crawlers. Set via environment variables."
        rows={botRows}
      />

      <EnvRefCard
        icon={Shield}
        title="Honeypot"
        description="Trap paths that catch bots ignoring robots.txt Disallow directives. Set via environment variables."
        rows={honeypotRows}
      />
    </AnimatedPage>
  )
}
