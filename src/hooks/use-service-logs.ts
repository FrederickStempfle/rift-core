"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export type ServiceLog = {
  id: number
  service_id: string
  timestamp: string
  level: string
  message: string
  source: string
}

export function useServiceLogs(serviceId: string | null) {
  const [logs, setLogs] = useState<ServiceLog[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const seenIds = useRef<Set<number>>(new Set())
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptRef = useRef(0)
  const connectRef = useRef<() => void>(() => {})

  const addLogs = useCallback((newLogs: ServiceLog[]) => {
    const unseen = newLogs.filter((l) => !seenIds.current.has(l.id))
    if (unseen.length === 0) return
    for (const l of unseen) seenIds.current.add(l.id)
    setLogs((prev) => [...prev, ...unseen])
  }, [])

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  useEffect(() => {
    if (!serviceId) return

    // HTTP fallback polling
    async function poll() {
      try {
        const res = await fetch(`/api/services/logs?id=${serviceId}`)
        if (res.ok) {
          const data: ServiceLog[] = await res.json()
          addLogs(data)
        }
      } catch {
        // silent
      }
    }

    function startPolling() {
      if (pollTimer.current) return
      pollTimer.current = setInterval(poll, 3000)
    }

    // WebSocket connection
    async function connect() {
      try {
        const tokenRes = await fetch("/api/ws-token")
        if (!tokenRes.ok) {
          startPolling()
          return
        }
        const { token } = await tokenRes.json()

        const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
        const url = `${proto}//${window.location.host}/api/ws/service-logs?token=${token}&service_id=${serviceId}`

        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
          stopPolling()
          attemptRef.current = 0
        }

        ws.onmessage = (event) => {
          try {
            const log: ServiceLog = JSON.parse(event.data)
            addLogs([log])
          } catch {
            // ignore malformed messages
          }
        }

        ws.onclose = () => {
          setConnected(false)
          wsRef.current = null
          startPolling()
          const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 10000)
          attemptRef.current++
          reconnectTimer.current = setTimeout(() => connectRef.current(), delay)
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        startPolling()
      }
    }

    connectRef.current = connect

    // Fetch initial logs then try WebSocket
    poll()
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
      stopPolling()
    }
  }, [serviceId, addLogs, stopPolling])

  const reset = useCallback(() => {
    setLogs([])
    seenIds.current.clear()
  }, [])

  return { logs, connected, reset }
}
