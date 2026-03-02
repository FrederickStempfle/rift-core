import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

async function fetchGitHub(url: string, token?: string) {
  const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(url, { headers })
}

/** Fetch all branches by following GitHub pagination (Link header). */
async function fetchAllBranches(baseUrl: string, token?: string): Promise<string[]> {
  const branches: string[] = []
  let url: string | null = `${baseUrl}?per_page=100`

  while (url) {
    const res = await fetchGitHub(url, token)
    if (!res.ok) return branches
    const data = await res.json()
    branches.push(...data.map((b: { name: string }) => b.name))

    // Parse Link header for next page
    const link = res.headers.get("link") ?? ""
    const next = link.match(/<([^>]+)>;\s*rel="next"/)
    url = next ? next[1] : null
  }

  return branches
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
  const branchesUrl = `https://api.github.com/repos/${ownerEnc}/${nameEnc}/branches`
  const repoUrl = `https://api.github.com/repos/${ownerEnc}/${nameEnc}`

  try {
    // Fetch repo info (for default branch) and all branches in parallel
    const [repoRes, authedBranches] = await Promise.all([
      fetchGitHub(repoUrl, session.accessToken),
      fetchAllBranches(branchesUrl, session.accessToken),
    ])

    let branches: string[]
    let defaultBranch: string | null = null

    if (authedBranches.length === 0) {
      // Fall back to unauthenticated for public repos
      const [pubRepo, pubBranches] = await Promise.all([
        fetchGitHub(repoUrl),
        fetchAllBranches(branchesUrl),
      ])
      if (pubBranches.length === 0) {
        return NextResponse.json({ error: "Failed to fetch branches" }, { status: 404 })
      }
      branches = pubBranches
      if (pubRepo.ok) {
        defaultBranch = (await pubRepo.json()).default_branch ?? null
      }
    } else {
      branches = authedBranches
      if (repoRes.ok) {
        defaultBranch = (await repoRes.json()).default_branch ?? null
      }
    }

    // Ensure default branch is always in the list
    if (defaultBranch && !branches.includes(defaultBranch)) {
      branches.unshift(defaultBranch)
    }

    // Sort: default branch first, then main/master, then alphabetical
    const priority = (name: string) => {
      if (name === defaultBranch) return 0
      if (name === "main") return 1
      if (name === "master") return 2
      return 3
    }
    branches.sort((a: string, b: string) => {
      const pa = priority(a), pb = priority(b)
      return pa !== pb ? pa - pb : a.localeCompare(b)
    })

    // If no default detected, prefer main > master > first
    if (!defaultBranch) {
      if (branches.includes("main")) defaultBranch = "main"
      else if (branches.includes("master")) defaultBranch = "master"
      else if (branches.length > 0) defaultBranch = branches[0]
    }

    return NextResponse.json({ branches, defaultBranch })
  } catch {
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 })
  }
}
