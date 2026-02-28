import "server-only"

import { cookies } from "next/headers"
import { auth } from "@/lib/auth"

const ACCESS_COOKIE = "rift_access_token"
const REFRESH_COOKIE = "rift_refresh_token"
const INTERNAL_HEADER = "x-rift-internal-token"

type RiftSessionResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_at: number
  refresh_expires_at: number
  user: {
    id: string
    email: string
    github_login?: string | null
    display_name?: string | null
    avatar_url?: string | null
    created_at: string
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function backendUrl(path: string): string {
  const base = process.env.RIFT_ENGINE_URL ?? "http://127.0.0.1:3001"
  return `${base.replace(/\/$/, "")}${path}`
}

function secureCookies(): boolean {
  return process.env.NODE_ENV === "production"
}

async function persistSession(session: RiftSessionResponse) {
  const cookieStore = await cookies()
  const now = Math.floor(Date.now() / 1000)
  const accessMaxAge = Math.max(session.expires_at - now, 1)
  const refreshMaxAge = Math.max(session.refresh_expires_at - now, 1)

  cookieStore.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: accessMaxAge,
  })

  cookieStore.set(REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: refreshMaxAge,
  })
}

export async function clearRiftSessionCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_COOKIE)
  cookieStore.delete(REFRESH_COOKIE)
}

async function exchangeGitHubSession(): Promise<string> {
  const session = await auth()
  const githubId = session?.user?.githubId ?? session?.user?.id
  if (!session?.user || !githubId) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(backendUrl("/api/users/exchange/github"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [INTERNAL_HEADER]: requireEnv("RIFT_INTERNAL_API_TOKEN"),
    },
    body: JSON.stringify({
      github_id: githubId,
      email: session.user.email ?? null,
      login: session.user.login ?? session.user.name ?? session.user.email?.split("@")[0] ?? "github-user",
      name: session.user.name ?? null,
      avatar_url: session.user.image ?? null,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to exchange GitHub session (${response.status})`)
  }

  const data = (await response.json()) as RiftSessionResponse
  await persistSession(data)
  return data.access_token
}

async function refreshRiftSession(refreshToken: string): Promise<string | null> {
  const response = await fetch(backendUrl("/api/users/refresh/internal"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [INTERNAL_HEADER]: requireEnv("RIFT_INTERNAL_API_TOKEN"),
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  })

  if (!response.ok) {
    await clearRiftSessionCookies()
    return null
  }

  const data = (await response.json()) as RiftSessionResponse
  await persistSession(data)
  return data.access_token
}

export async function getRiftAccessToken(): Promise<string> {
  const session = await auth()
  if (!session) {
    throw new Error("Not authenticated")
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value
  if (accessToken) {
    return accessToken
  }

  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    const refreshed = await refreshRiftSession(refreshToken)
    if (refreshed) {
      return refreshed
    }
  }

  return exchangeGitHubSession()
}

export async function revokeRiftSession() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    await fetch(backendUrl("/api/users/logout/internal"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [INTERNAL_HEADER]: requireEnv("RIFT_INTERNAL_API_TOKEN"),
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    }).catch(() => undefined)
  }

  await clearRiftSessionCookies()
}

export async function fetchRift(path: string, init: RequestInit = {}): Promise<Response> {
  const perform = async (token: string) => {
    const headers = new Headers(init.headers ?? {})
    headers.set("Authorization", `Bearer ${token}`)
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    return fetch(backendUrl(path), {
      ...init,
      headers,
      cache: "no-store",
    })
  }

  let accessToken = await getRiftAccessToken()
  let response = await perform(accessToken)

  if (response.status !== 401) {
    return response
  }

  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  accessToken = refreshToken
    ? (await refreshRiftSession(refreshToken)) ?? (await exchangeGitHubSession())
    : await exchangeGitHubSession()

  response = await perform(accessToken)
  if (response.status === 401) {
    await clearRiftSessionCookies()
  }

  return response
}
