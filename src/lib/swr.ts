import type { SWRConfiguration } from "swr"

type FetchError = Error & { status?: number }

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    const data: { error?: string } = await res.json().catch(() => ({}))
    const error: FetchError = new Error(data.error || `Request failed (${res.status})`)
    error.status = res.status
    throw error
  }
  return res.json()
}

export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
}
