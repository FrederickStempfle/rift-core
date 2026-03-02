import type { SWRConfiguration } from "swr"

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const error = new Error(data.error || `Request failed (${res.status})`)
    ;(error as any).status = res.status
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
