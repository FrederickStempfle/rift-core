"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type DeployLog = {
  id: number
  deployment_id: string
  timestamp: string
  level: string
  message: string
  source: string
}

type UseDeployLogsOptions = {
  deploymentId: string | null
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

export function useDeployLogs({ deploymentId, isActive }: UseDeployLogsOptions) {
  const [logs, setLogs] = useState<DeployLog[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const seenIdsRef = useRef(new Set<number>())
  const previousDeploymentIdRef = useRef<string | null>(null)

  const fetchLogsHttp = useCallback(async () => {
    if (!deploymentId) return
    try {
      const res = await fetch(
        `/api/logs?deployment_id=${encodeURIComponent(deploymentId)}`,
        { cache: "no-store" }
      )
      if (res.ok) {
        const data = (await res.json()) as DeployLog[]
        setLogs(data)
        seenIdsRef.current = new Set(data.map((l) => l.id))
      }
    } catch {
      // silently fail
    }
  }, [deploymentId])

  useEffect(() => {
    if (deploymentId === previousDeploymentIdRef.current) return
    previousDeploymentIdRef.current = deploymentId
    setLogs([])
    seenIdsRef.current.clear()
  }, [deploymentId])

  useEffect(() => {
    if (!deploymentId) {
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
      const query = `token=${encodeURIComponent(token)}&deployment_id=${encodeURIComponent(deploymentId)}`
      const candidates: string[] = []
      const seen = new Set<string>()

      const add = (base: string) => {
        const normalized = base.trim().replace(/\/+$/, "")
        if (!normalized) return
        const full = `${normalized}/api/ws/logs?${query}`
        if (seen.has(full)) return
        seen.add(full)
        candidates.push(full)
      }

      // Preferred: same-origin websocket path. Next rewrites this to the engine.
      add(wsOriginFromHttpOrigin(window.location.origin))

      // Legacy fallback: connect to engine API port directly.
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
              const log = JSON.parse(event.data as string) as DeployLog
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

    // Seed history immediately while WS comes up.
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
  }, [deploymentId, isActive, fetchLogsHttp])

  const reset = useCallback(() => {
    setLogs([])
    seenIdsRef.current.clear()
  }, [])

  return { logs, connected, reset }
}
