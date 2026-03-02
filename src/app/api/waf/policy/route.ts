import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"

type BackendPolicy = {
  project_id: string | null
  mode: string
  fail_open: boolean
}

function mapPolicy(p: BackendPolicy) {
  return {
    projectId: p.project_id,
    mode: p.mode,
    failOpen: p.fail_open,
  }
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const url = projectId
    ? `/api/waf/policy?project_id=${encodeURIComponent(projectId)}`
    : "/api/waf/policy"

  try {
    const res = await fetchRift(url)
    const data = await res.json()
    return NextResponse.json(mapPolicy(data as BackendPolicy), { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const payload = await request.json()
    const res = await fetchRift("/api/waf/policy", {
      method: "PUT",
      body: JSON.stringify({
        project_id: payload.projectId ?? null,
        mode: payload.mode,
        fail_open: payload.failOpen ?? true,
      }),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
