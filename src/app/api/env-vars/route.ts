import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"

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
    const res = await fetchRift(`/api/env-vars?project_id=${encodeURIComponent(projectId)}`)
    const data = await res.json().catch(() => [])
    return NextResponse.json(data, { status: res.status })
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
    const res = await fetchRift("/api/env-vars", {
      method: "POST",
      body: JSON.stringify({
        project_id: payload.projectId,
        key: payload.key,
        value: payload.value,
      }),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
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
      `/api/env-vars/${id}?project_id=${encodeURIComponent(projectId)}`,
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
