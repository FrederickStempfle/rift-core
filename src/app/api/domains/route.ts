import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"

type BackendDomain = {
  id: string
  project_id: string | null
  service_id: string | null
  domain: string
  is_primary: boolean
  ssl_status: "pending" | "provisioning" | "active" | "failed"
  ssl_expires_at?: string | null
  ssl_error?: string | null
  target_url?: string | null
  project_name?: string | null
  service_name?: string | null
}

function mapDomain(domain: BackendDomain) {
  return {
    id: domain.id,
    projectId: domain.project_id ?? null,
    serviceId: domain.service_id ?? null,
    projectName: domain.project_name ?? null,
    serviceName: domain.service_name ?? null,
    domain: domain.domain,
    isPrimary: domain.is_primary,
    verified: domain.ssl_status === "active" || domain.ssl_status === "provisioning",
    sslStatus: domain.ssl_status,
    targetUrl: domain.target_url ?? null,
  }
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  if (searchParams.get("serverIp") === "true") {
    try {
      const engineUrl = process.env.RIFT_ENGINE_URL ?? "http://127.0.0.1:3001"
      const res = await fetch(`${engineUrl.replace(/\/$/, "")}/api/server-info`, { cache: "no-store" })
      const data = await res.json()
      return NextResponse.json({ ip: data.public_ip || "" })
    } catch {
      return NextResponse.json({ ip: "" })
    }
  }

  try {
    const projectId = searchParams.get("projectId")
    const serviceId = searchParams.get("serviceId")
    const path = projectId
      ? `/api/domains?project_id=${encodeURIComponent(projectId)}`
      : serviceId
        ? `/api/domains?service_id=${encodeURIComponent(serviceId)}`
        : "/api/domains"
    const response = await fetchRift(path)
    const data = (await response.json().catch(() => [])) as BackendDomain[]
    return NextResponse.json(data.map(mapDomain), { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const payload = await request.json()
    const body: Record<string, unknown> = {
      domain: payload.domain,
      is_primary: payload.isPrimary ?? false,
    }
    if (payload.projectId) {
      body.project_id = payload.projectId
    }
    const response = await fetchRift("/api/domains", {
      method: "POST",
      body: JSON.stringify(body),
    })
    const data = (await response.json().catch(() => ({}))) as BackendDomain
    return NextResponse.json(mapDomain(data), { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const payload = await request.json()

    if (payload.action === "update") {
      const response = await fetchRift(`/api/domains/${payload.domainId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_primary: payload.isPrimary }),
      })
      const data = (await response.json().catch(() => ({}))) as BackendDomain
      return NextResponse.json(mapDomain(data), { status: response.status })
    }

    if (payload.action === "assign") {
      const body: Record<string, unknown> = {}
      if (payload.serviceId) {
        body.service_id = payload.serviceId
        body.target_url = payload.targetUrl
      } else {
        body.project_id = payload.projectId ?? null
      }
      const response = await fetchRift(`/api/domains/${payload.domainId}/assign`, {
        method: "POST",
        body: JSON.stringify(body),
      })
      const data = (await response.json().catch(() => ({}))) as BackendDomain
      return NextResponse.json(mapDomain(data), { status: response.status })
    }

    // Default: verify DNS
    const response = await fetchRift(`/api/domains/${payload.domainId}/verify`, {
      method: "POST",
    })
    const data = (await response.json().catch(() => ({}))) as BackendDomain
    return NextResponse.json(mapDomain(data), { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  try {
    const response = await fetchRift(`/api/domains/${id}`, { method: "DELETE" })
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }
    const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 500 })
  }
}
