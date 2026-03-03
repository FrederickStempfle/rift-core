"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type ServiceLog = {
  id: number
  service_id: string
  timestamp: string
  level: string
  message: string
  source: string
}

type UseServiceLogsOptions = {
  serviceId: string | null
  isActive: boolean
}

const WS_RECONNECT_BASE_DELAY_MS = 1_000
const WS_RECONNECT_MAX_DELAY_MS = 10_000
const WS_POLL_INTERVAL_MS = 1_500

function wsOriginFromHttpOrigin(origin: string): string {
  if (origin.startsWith("https://")) return `wss://${origin.slice("https://".length)}`
  if (origin.startsWith("http://")) return `ws://${origin.slice("http://".length)}`
  return origin
}

export function useServiceLogs({ serviceId, isActive }: UseServiceLogsOptions) {
  const [logs, setLogs] = useState<ServiceLog[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const seenIdsRef = useRef(new Set<number>())
  const previousServiceIdRef = useRef<string | null>(null)

  const fetchLogsHttp = useCallback(async () => {
    if (!serviceId) return
    try {
      const res = await fetch(
        `/api/services/${encodeURIComponent(serviceId)}/logs`,
        { cache: "no-store" }
      )
      if (res.ok) {
        const data = (await res.json()) as ServiceLog[]
        setLogs(data)
        seenIdsRef.current = new Set(data.map((l) => l.id))
      }
    } catch {
      // silently fail
    }
  }, [serviceId])

  useEffect(() => {
    if (serviceId === previousServiceIdRef.current) return
    previousServiceIdRef.current = serviceId
    setLogs([])
    seenIdsRef.current.clear()
  }, [serviceId])

  useEffect(() => {
    if (!serviceId) {
      setConnected(false)
      wsRef.current?.close()
      wsRef.current = null
      return
    }

    if (!isActive) {
      setConnected(false)
      void fetchLogsHttp()
      return
    }

    let cancelled = false
    let reconnectDelayMs = WS_RECONNECT_BASE_DELAY_MS
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let pollTimer: ReturnType<typeof setTimeout> | null = null

    const clearReconnectTimer = () => {
      if (!reconnectTimer) return
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    const clearPollTimer = () => {
      if (!pollTimer) return
      clearTimeout(pollTimer)
      pollTimer = null
    }

    const startPolling = () => {
      if (cancelled || pollTimer) return

      const pollOnce = async () => {
        if (cancelled) return
        await fetchLogsHttp()
        if (cancelled) return
        pollTimer = setTimeout(() => {
          pollTimer = null
          void pollOnce()
        }, WS_POLL_INTERVAL_MS)
      }

      void pollOnce()
    }

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimer) return

      const waitMs = reconnectDelayMs
      reconnectDelayMs = Math.min(reconnectDelayMs * 2, WS_RECONNECT_MAX_DELAY_MS)
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        void connect()
      }, waitMs)
    }

    const buildCandidateUrls = (token: string): string[] => {
      const query = `token=${encodeURIComponent(token)}&service_id=${encodeURIComponent(serviceId)}`
      const candidates: string[] = []
      const seen = new Set<string>()

      const add = (base: string) => {
        const normalized = base.trim().replace(/\/+$/, "")
        if (!normalized) return
        const full = `${normalized}/api/ws/service-logs?${query}`
        if (seen.has(full)) return
        seen.add(full)
        candidates.push(full)
      }

      add(wsOriginFromHttpOrigin(window.location.origin))

      const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
      const host = window.location.hostname
      const enginePort = process.env.NEXT_PUBLIC_RIFT_ENGINE_PORT ?? "3001"
      add(`${proto}//${host}:${enginePort}`)

      return candidates
    }

    async function connect() {
      if (cancelled) return

      try {
        setConnected(false)
        startPolling()

        const tokenRes = await fetch("/api/ws-token")
        if (!tokenRes.ok) throw new Error("Failed to get token")
        const { token } = await tokenRes.json()

        if (cancelled) return

        const urls = buildCandidateUrls(token)

        const tryCandidate = (index: number) => {
          if (cancelled) return
          if (index >= urls.length) {
            scheduleReconnect()
            return
          }

          const socket = new WebSocket(urls[index])
          let opened = false
          wsRef.current = socket

          socket.onopen = () => {
            if (cancelled) {
              socket.close()
              return
            }
            opened = true
            reconnectDelayMs = WS_RECONNECT_BASE_DELAY_MS
            setConnected(true)
            clearPollTimer()
          }

          socket.onmessage = (event) => {
            try {
              const log = JSON.parse(event.data as string) as ServiceLog
              if (!seenIdsRef.current.has(log.id)) {
                seenIdsRef.current.add(log.id)
                setLogs((prev) => [...prev, log])
              }
            } catch {
              // ignore malformed messages
            }
          }

          socket.onclose = () => {
            if (wsRef.current === socket) wsRef.current = null
            if (cancelled) return
            setConnected(false)
            startPolling()
            if (!opened) {
              tryCandidate(index + 1)
              return
            }
            scheduleReconnect()
          }

          socket.onerror = () => {
            socket.close()
          }
        }

        tryCandidate(0)
      } catch {
        if (cancelled) return
        setConnected(false)
        startPolling()
        scheduleReconnect()
      }
    }

    void fetchLogsHttp()
    void connect()

    return () => {
      cancelled = true
      clearReconnectTimer()
      clearPollTimer()
      wsRef.current?.close()
      wsRef.current = null
      setConnected(false)
    }
  }, [serviceId, isActive, fetchLogsHttp])

  const reset = useCallback(() => {
    setLogs([])
    seenIdsRef.current.clear()
  }, [])

  return { logs, connected, reset }
}
