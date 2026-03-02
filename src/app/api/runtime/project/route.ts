import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 })

  const res = await fetchRift(`/api/runtime/project?project_id=${encodeURIComponent(projectId)}`)
  if (!res.ok) return NextResponse.json({ error: "Failed to fetch" }, { status: res.status })

  return NextResponse.json(await res.json())
}
