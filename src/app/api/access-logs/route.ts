import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const params = new URLSearchParams()

  const map = [
    ["projectId", "project_id"],
    ["beforeId", "before_id"],
    ["from", "from"],
    ["to", "to"],
    ["host", "host"],
    ["pathPrefix", "path_prefix"],
    ["status", "status"],
    ["clientIp", "client_ip"],
    ["limit", "limit"],
  ] as const

  for (const [fromKey, toKey] of map) {
    const value = searchParams.get(fromKey)
    if (value && value.trim().length > 0) {
      params.set(toKey, value.trim())
    }
  }

  try {
    const suffix = params.toString()
    const response = await fetchRift(`/api/access-logs${suffix ? `?${suffix}` : ""}`)
    const data = await response
      .json()
      .catch(() => ({ error: "Unexpected backend response" }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    return NextResponse.json(
      { error: message },
      { status: message === "Not authenticated" ? 401 : 500 }
    )
  }
}
