import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

async function fetchGitHub(url: string, token?: string) {
  const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(url, { headers })
}

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

  const [owner, name] = repo.split("/")
  const ownerEnc = encodeURIComponent(owner)
  const nameEnc = encodeURIComponent(name)

  try {
    // Fetch branches and repo info (for default branch) in parallel
    const [branchesRes, repoRes] = await Promise.all([
      fetchGitHub(`https://api.github.com/repos/${ownerEnc}/${nameEnc}/branches?per_page=100`, session.accessToken),
      fetchGitHub(`https://api.github.com/repos/${ownerEnc}/${nameEnc}`, session.accessToken),
    ])

    let branches: string[]
    let defaultBranch: string | null = null

    if (!branchesRes.ok) {
      // Fall back to unauthenticated for public repos
      const [pubBranches, pubRepo] = await Promise.all([
        fetchGitHub(`https://api.github.com/repos/${ownerEnc}/${nameEnc}/branches?per_page=100`),
        fetchGitHub(`https://api.github.com/repos/${ownerEnc}/${nameEnc}`),
      ])
      if (!pubBranches.ok) {
        return NextResponse.json({ error: "Failed to fetch branches" }, { status: pubBranches.status })
      }
      branches = (await pubBranches.json()).map((b: { name: string }) => b.name)
      if (pubRepo.ok) {
        defaultBranch = (await pubRepo.json()).default_branch ?? null
      }
    } else {
      branches = (await branchesRes.json()).map((b: { name: string }) => b.name)
      if (repoRes.ok) {
        defaultBranch = (await repoRes.json()).default_branch ?? null
      }
    }

    return NextResponse.json({ branches, defaultBranch })
  } catch {
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 })
  }
}
