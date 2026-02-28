import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")
    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 })
    }

    const response = await fetchRift(`/api/deployments?project_id=${encodeURIComponent(projectId)}`)
    const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const payload = await request.json()
    const response = await fetchRift("/api/deployments", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 500 })
  }
}
