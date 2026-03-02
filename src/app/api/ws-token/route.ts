import { NextResponse } from "next/server"
import { getRiftAccessToken } from "@/lib/rift"

export async function GET() {
  try {
    const token = await getRiftAccessToken()
    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
}
