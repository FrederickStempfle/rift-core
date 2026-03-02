import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"

type BackendWafRule = {
  id: string
  project_id: string | null
  name: string
  description: string
  match_field: string
  match_op: string
  match_value: string
  header_name: string | null
  action: string
  priority: number
  enabled: boolean
  is_managed: boolean
  created_at: string
  updated_at: string
}

function mapRule(r: BackendWafRule) {
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    description: r.description,
    matchField: r.match_field,
    matchOp: r.match_op,
    matchValue: r.match_value,
    headerName: r.header_name,
    action: r.action,
    priority: r.priority,
    enabled: r.enabled,
    isManaged: r.is_managed,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const url = projectId
    ? `/api/waf/rules?project_id=${encodeURIComponent(projectId)}`
    : "/api/waf/rules"

  try {
    const res = await fetchRift(url)
    const data = (await res.json().catch(() => [])) as BackendWafRule[]
    return NextResponse.json(Array.isArray(data) ? data.map(mapRule) : [], { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const payload = await request.json()
    const res = await fetchRift("/api/waf/rules", {
      method: "POST",
      body: JSON.stringify({
        project_id: payload.projectId ?? null,
        name: payload.name,
        description: payload.description ?? "",
        match_field: payload.matchField,
        match_op: payload.matchOp,
        match_value: payload.matchValue,
        header_name: payload.headerName ?? null,
        action: payload.action,
        priority: payload.priority ?? 100,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(mapRule(data as BackendWafRule), { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ruleId = searchParams.get("ruleId")
  if (!ruleId) return NextResponse.json({ error: "ruleId required" }, { status: 400 })

  try {
    const payload = await request.json()
    const res = await fetchRift(`/api/waf/rules/${ruleId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: payload.name,
        description: payload.description ?? "",
        match_field: payload.matchField,
        match_op: payload.matchOp,
        match_value: payload.matchValue,
        header_name: payload.headerName ?? null,
        action: payload.action,
        priority: payload.priority ?? 100,
        enabled: payload.enabled ?? true,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(mapRule(data as BackendWafRule), { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ruleId = searchParams.get("ruleId")
  if (!ruleId) return NextResponse.json({ error: "ruleId required" }, { status: 400 })

  try {
    const res = await fetchRift(`/api/waf/rules/${ruleId}`, { method: "DELETE" })
    if (res.status === 204) return new NextResponse(null, { status: 204 })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
