"use client"

import { useState } from "react"
import { Check, Copy, Globe, Lock, Network, Server } from "lucide-react"
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

const platformRows: ConfigRow[] = [
  {
    env: "RIFT_BASE_DOMAIN",
    label: "Base Domain",
    description:
      "Root domain for all deployments. Deployments are served at <name>.<base-domain>.",
    defaultValue: "localhost",
  },
  {
    env: "RIFT_PROXY_SCHEME",
    label: "Proxy Scheme",
    description:
      "Protocol used to build public URLs. Set to 'https' when TLS termination is active.",
    defaultValue: "http",
  },
  {
    env: "RIFT_PUBLIC_IP",
    label: "Public IP Override",
    description:
      "Overrides auto-detected public IP. Useful behind NAT or when multiple network interfaces exist.",
    defaultValue: "(auto-detected)",
  },
  {
    env: "RIFT_CORS_ORIGIN",
    label: "CORS Allowed Origin",
    description: "Origin the dashboard is served from. Required for browser API calls to succeed.",
    defaultValue: "http://localhost:3000",
  },
]

const serverRows: ConfigRow[] = [
  {
    env: "RIFT_API_BIND",
    label: "API Bind Address",
    description: "Network interface the REST API listens on. Use 0.0.0.0 to bind all interfaces.",
    defaultValue: "0.0.0.0",
  },
  {
    env: "RIFT_API_PORT",
    label: "API Port",
    description: "Port the REST API server listens on.",
    defaultValue: "3001",
  },
  {
    env: "RIFT_PROXY_BIND",
    label: "Proxy Bind Address",
    description: "Network interface the reverse proxy listens on.",
    defaultValue: "0.0.0.0",
  },
  {
    env: "RIFT_PROXY_PORT",
    label: "Proxy HTTP Port",
    description: "Port for HTTP traffic through the reverse proxy.",
    defaultValue: "8080",
  },
  {
    env: "RIFT_HTTPS_PORT",
    label: "Proxy HTTPS Port",
    description: "Port for TLS-terminated HTTPS traffic.",
    defaultValue: "8443",
  },
  {
    env: "RIFT_ROLE",
    label: "Node Role",
    description:
      "Service role this instance runs: 'control-plane' (API + proxy) or 'edge-agent' (proxy only).",
    defaultValue: "control-plane",
  },
]

const proxyRows: ConfigRow[] = [
  {
    env: "RIFT_PROXY_UPSTREAM_TIMEOUT_MS",
    label: "Upstream Timeout",
    description: "Maximum milliseconds to wait for an upstream response before returning 504.",
    defaultValue: "30000",
  },
  {
    env: "RIFT_PROXY_CONNECT_TIMEOUT_MS",
    label: "Connect Timeout",
    description: "Maximum milliseconds to establish a TCP connection to an upstream worker.",
    defaultValue: "3000",
  },
  {
    env: "RIFT_PROXY_POOL_MAX_IDLE_PER_HOST",
    label: "Idle Connections per Host",
    description:
      "Maximum idle TCP connections kept in the connection pool per upstream host.",
    defaultValue: "128",
  },
  {
    env: "RIFT_PROXY_MAX_INFLIGHT",
    label: "Max In-Flight Requests",
    description: "Global cap on concurrent proxy requests. Excess requests receive HTTP 503.",
    defaultValue: "4000",
  },
  {
    env: "RIFT_TRUSTED_PROXY_CIDRS",
    label: "Trusted Proxy CIDRs",
    description:
      "Comma-separated CIDR ranges trusted to set X-Forwarded-For. Required when behind a load balancer.",
    defaultValue: "(none)",
  },
]

const authRows: ConfigRow[] = [
  {
    env: "RIFT_ACCESS_TOKEN_TTL_MINUTES",
    label: "Access Token Lifetime",
    description: "Minutes until a JWT access token expires and a refresh is needed.",
    defaultValue: "15",
  },
  {
    env: "RIFT_REFRESH_TOKEN_TTL_DAYS",
    label: "Refresh Token Lifetime",
    description: "Days until a refresh token expires and the user must re-authenticate.",
    defaultValue: "7",
  },
  {
    env: "RIFT_COOKIE_SECURE",
    label: "Secure Cookie Flag",
    description: "Adds the Secure attribute to session cookies. Must be true when using HTTPS.",
    defaultValue: "false",
  },
]

export default function GeneralSettingsPage() {
  return (
    <AnimatedPage className="flex flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">General Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform configuration loaded from environment variables at startup. Click any variable
          name to copy it.
        </p>
      </div>

      <ConfigCard
        icon={Globe}
        title="Platform"
        description="Public-facing domain, protocol, and CORS settings."
        rows={platformRows}
      />

      <ConfigCard
        icon={Server}
        title="Server Binding"
        description="Network addresses and ports for the API and proxy services."
        rows={serverRows}
      />

      <ConfigCard
        icon={Network}
        title="Reverse Proxy"
        description="Upstream timeouts, connection pooling, and traffic limits."
        rows={proxyRows}
      />

      <ConfigCard
        icon={Lock}
        title="Authentication"
        description="JWT token lifetimes and session cookie security settings."
        rows={authRows}
      />
    </AnimatedPage>
  )
}
