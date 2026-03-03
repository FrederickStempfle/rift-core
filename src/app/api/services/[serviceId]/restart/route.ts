import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRift } from "@/lib/rift"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { serviceId } = await params
    const response = await fetchRift(`/api/services/${encodeURIComponent(serviceId)}/restart`, {
      method: "POST",
    })

    if (response.status === 202) {
      return new NextResponse(null, { status: 202 })
    }

    const data = await response.json().catch(() => ({ error: "Unexpected backend response" }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected backend error"
    const status = message === "Not authenticated" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
