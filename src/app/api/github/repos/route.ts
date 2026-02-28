import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    )
  }

  const res = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member",
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: res.status }
    )
  }

  const repos = await res.json()

  const simplified = repos.map(
    (repo: {
      name: string
      full_name: string
      html_url: string
      default_branch: string
      private: boolean
      language: string | null
      updated_at: string
    }) => ({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      private: repo.private,
      language: repo.language,
      updatedAt: repo.updated_at,
    })
  )

  return NextResponse.json(simplified)
}
