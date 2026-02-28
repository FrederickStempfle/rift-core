import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const repo = searchParams.get("repo") // "owner/repo" format

  if (!repo) {
    return NextResponse.json({ error: "repo parameter required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(repo.split("/")[0])}/${encodeURIComponent(repo.split("/")[1])}/branches?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    if (!res.ok) {
      // Fall back to unauthenticated for public repos
      const publicRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(repo.split("/")[0])}/${encodeURIComponent(repo.split("/")[1])}/branches?per_page=100`,
        { headers: { Accept: "application/vnd.github.v3+json" } }
      )
      if (!publicRes.ok) {
        return NextResponse.json({ error: "Failed to fetch branches" }, { status: publicRes.status })
      }
      const branches = await publicRes.json()
      return NextResponse.json(
        branches.map((b: { name: string }) => b.name)
      )
    }

    const branches = await res.json()
    return NextResponse.json(
      branches.map((b: { name: string }) => b.name)
    )
  } catch {
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 })
  }
}
