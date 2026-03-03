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

    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get("id")
    const action = searchParams.get("action")

    // Control actions: stop, start, restart
    if (serviceId && action) {
      const response = await fetchRift(
        `/api/services/${encodeURIComponent(serviceId)}/${encodeURIComponent(action)}`,
        { method: "POST" }
      )

      if (response.status === 202) {
        return new NextResponse(null, { status: 202 })
      }

      const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))
      return NextResponse.json(data, { status: response.status })
    }

    // Create service
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

export async function DELETE(request: Request) {
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

    const response = await fetchRift(`/api/services/${encodeURIComponent(serviceId)}`, {
      method: "DELETE",
    })

    if (response.status === 202 || response.status === 204) {
      return new NextResponse(null, { status: response.status })
    }

    const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    const status = message === "Not authenticated" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
