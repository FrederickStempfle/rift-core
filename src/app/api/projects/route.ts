import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const response = await fetchRift("/api/projects")
    const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    const status = message === "Not authenticated" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const payload = await request.json()
    const response = await fetchRift("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    const status = message === "Not authenticated" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("id")
    if (!projectId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const payload = await request.json()
    const response = await fetchRift(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    const status = message === "Not authenticated" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("id")
    if (!projectId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const response = await fetchRift(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "DELETE",
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    const status = message === "Not authenticated" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
