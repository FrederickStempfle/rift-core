"use client"

import { Globe, Lock, Network, Server } from "lucide-react"
import { AnimatedPage } from "@/components/animated-page"
import { ConfigCard, type ConfigRow } from "@/components/config-card"

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
    <AnimatedPage className="flex flex-col gap-6 p-4 sm:p-6">
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
