"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type TrafficEvent = {
  timestamp: string
  src_lat: number
  src_lng: number
  dst_lat: number
  dst_lng: number
  method: string
  status: number
  host: string | null
  country: string | null
  duration_ms: number
}

export type TrafficArc = {
  id: string
  srcLat: number
  srcLng: number
  dstLat: number
  dstLng: number
  color: string
}

const MAX_ARCS = 20
const WS_RECONNECT_BASE_DELAY_MS = 1_000
const WS_RECONNECT_MAX_DELAY_MS = 10_000

function statusColor(status: number): string {
  if (status >= 500) return "rgba(239,68,68,0.9)"
  if (status >= 400) return "rgba(249,115,22,0.9)"
  if (status >= 300) return "rgba(99,183,255,0.9)"
  return "rgba(52,211,153,0.9)"
}

function wsOriginFromHttpOrigin(origin: string): string {
  if (origin.startsWith("https://")) return `wss://${origin.slice("https://".length)}`
  if (origin.startsWith("http://")) return `ws://${origin.slice("http://".length)}`
  return origin
}

export function useLiveTraffic() {
  const [arcs, setArcs] = useState<TrafficArc[]>([])
  const [events, setEvents] = useState<TrafficEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [totalRequests, setTotalRequests] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const arcIdRef = useRef(0)

  const addEvent = useCallback((event: TrafficEvent) => {
    const id = String(++arcIdRef.current)
    const arc: TrafficArc = {
      id,
      srcLat: event.src_lat,
      srcLng: event.src_lng,
      dstLat: event.dst_lat,
      dstLng: event.dst_lng,
      color: statusColor(event.status),
    }
    setArcs((prev) => {
      const next = [...prev, arc]
      return next.length > MAX_ARCS ? next.slice(next.length - MAX_ARCS) : next
    })
    setEvents((prev) => {
      const next = [event, ...prev]
      return next.length > 10 ? next.slice(0, 10) : next
    })
    setTotalRequests((n) => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    let reconnectDelayMs = WS_RECONNECT_BASE_DELAY_MS
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

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
      const query = `token=${encodeURIComponent(token)}`
      const candidates: string[] = []
      const seen = new Set<string>()
      const add = (base: string) => {
        const normalized = base.trim().replace(/\/+$/, "")
        if (!normalized) return
        const full = `${normalized}/api/ws/traffic?${query}`
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
        const tokenRes = await fetch("/api/ws-token")
        if (!tokenRes.ok) throw new Error("Failed to get WS token")
        const { token } = (await tokenRes.json()) as { token: string }
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
            if (cancelled) { socket.close(); return }
            opened = true
            reconnectDelayMs = WS_RECONNECT_BASE_DELAY_MS
            setConnected(true)
          }

          socket.onmessage = (ev) => {
            try {
              const event = JSON.parse(ev.data as string) as TrafficEvent
              addEvent(event)
            } catch { /* ignore */ }
          }

          socket.onclose = () => {
            if (wsRef.current === socket) wsRef.current = null
            if (cancelled) return
            setConnected(false)
            if (!opened) { tryCandidate(index + 1); return }
            scheduleReconnect()
          }

          socket.onerror = () => { socket.close() }
        }

        tryCandidate(0)
      } catch {
        if (cancelled) return
        setConnected(false)
        scheduleReconnect()
      }
    }

    void connect()

    return () => {
      cancelled = true
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
      wsRef.current?.close()
      wsRef.current = null
      setConnected(false)
    }
  }, [addEvent])

  return { arcs, events, connected, totalRequests }
}
