import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"

type BackendRule = {
  id: string
  project_id: string
  cidr: string
  action: "allow" | "block"
  description: string
  created_at: string
}

function mapRule(r: BackendRule) {
  return {
    id: r.id,
    projectId: r.project_id,
    cidr: r.cidr,
    action: r.action,
    description: r.description,
    createdAt: r.created_at,
  }
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 })
  }

  try {
    if (searchParams.get("mode") === "1") {
      const res = await fetchRift(`/api/firewall/mode?project_id=${encodeURIComponent(projectId)}`)
      return NextResponse.json(await res.json(), { status: res.status })
    }

    const res = await fetchRift(`/api/firewall/rules?project_id=${encodeURIComponent(projectId)}`)
    const data = (await res.json().catch(() => [])) as BackendRule[]
    return NextResponse.json(data.map(mapRule), { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const payload = await request.json()
    const res = await fetchRift("/api/firewall/rules", {
      method: "POST",
      body: JSON.stringify({
        project_id: payload.projectId,
        cidr: payload.cidr,
        action: payload.action,
        description: payload.description ?? "",
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json(mapRule(data as BackendRule), { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const projectId = searchParams.get("projectId")
  if (!id || !projectId) {
    return NextResponse.json({ error: "id and projectId required" }, { status: 400 })
  }

  try {
    const res = await fetchRift(
      `/api/firewall/rules/${id}?project_id=${encodeURIComponent(projectId)}`,
      { method: "DELETE" },
    )
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 })
    }
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const payload = await request.json()
    const res = await fetchRift("/api/firewall/mode", {
      method: "PUT",
      body: JSON.stringify({
        project_id: payload.projectId,
        mode: payload.mode,
      }),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
