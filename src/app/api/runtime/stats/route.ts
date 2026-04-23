import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"
import { NextResponse } from "next/server"

export async function GET() {
  console.log("[pool-stats] GET called")
  const session = await auth()
  if (!session?.user) {
    console.log("[pool-stats] no session, returning 401")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  console.log("[pool-stats] session ok, fetching from engine")

  try {
    const res = await fetchRift("/api/runtime/stats")
    console.log("[pool-stats] engine response status:", res.status)
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch" }, { status: res.status })
    const data = await res.json()
    console.log("[pool-stats] engine data:", JSON.stringify(data))
    return NextResponse.json(data)
  } catch (e) {
    console.error("[pool-stats] fetchRift threw:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
