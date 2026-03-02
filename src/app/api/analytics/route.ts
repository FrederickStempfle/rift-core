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
  const period = searchParams.get("period") || "24h"

  try {
    const params = new URLSearchParams({ period })
    if (projectId) {
      params.set("project_id", projectId)
    }
    const res = await fetchRift(`/api/analytics?${params.toString()}`)
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
