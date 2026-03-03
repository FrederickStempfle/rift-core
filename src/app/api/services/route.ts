import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const response = await fetchRift("/api/services")
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
    const response = await fetchRift("/api/services", {
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
