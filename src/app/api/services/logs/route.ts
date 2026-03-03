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
    const serviceId = searchParams.get("id")
    if (!serviceId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const response = await fetchRift(
      `/api/services/${encodeURIComponent(serviceId)}/logs`
    )
    const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    const status = message === "Not authenticated" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
