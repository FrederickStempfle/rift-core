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

export function useDeployLogs({ deploymentId, isActive }: UseDeployLogsOptions) {
  const [logs, setLogs] = useState<DeployLog[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const seenIdsRef = useRef(new Set<number>())

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
    if (!deploymentId || !isActive) {
      if (deploymentId) void fetchLogsHttp()
      return
    }

    let ws: WebSocket | null = null
    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | null = null

    async function connect() {
      try {
        const tokenRes = await fetch("/api/ws-token")
        if (!tokenRes.ok) throw new Error("Failed to get token")
        const { token } = await tokenRes.json()

        if (cancelled) return

        // Derive the engine WS URL from the current page host.
        // The engine runs on port 3001 on the same machine.
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
        const host = window.location.hostname
        const enginePort = process.env.NEXT_PUBLIC_RIFT_ENGINE_PORT ?? "3001"
        const wsUrl = `${proto}//${host}:${enginePort}`
        const url = `${wsUrl}/api/ws/logs?token=${encodeURIComponent(token)}&deployment_id=${encodeURIComponent(deploymentId!)}`

        ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (!cancelled) setConnected(true)
        }

        ws.onmessage = (event) => {
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

        ws.onclose = () => {
          if (!cancelled) {
            setConnected(false)
            // Fall back to continuous polling if still active
            function poll() {
              if (cancelled) return
              void fetchLogsHttp()
              pollTimer = setTimeout(poll, 3000)
            }
            pollTimer = setTimeout(poll, 1000)
          }
        }

        ws.onerror = () => {
          ws?.close()
        }
      } catch {
        // WS connection failed, fall back to continuous HTTP polling
        if (!cancelled) {
          function poll() {
            if (cancelled) return
            void fetchLogsHttp()
            pollTimer = setTimeout(poll, 3000)
          }
          poll()
        }
      }
    }

    void connect()

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
      ws?.close()
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
