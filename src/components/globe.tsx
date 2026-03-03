"use client"

import { useEffect, useRef, useCallback } from "react"
import createGlobe from "cobe"

export type TrafficArc = {
  id: string
  srcLat: number
  srcLng: number
  dstLat: number
  dstLng: number
  color: string
}

interface GlobeProps {
  className?: string
  arcs?: TrafficArc[]
}

const ARC_DURATION = 2500 // ms
const PHI_SPEED = 0.003   // radians/frame auto-rotate
const MIN_SCALE = 0.85
const MAX_SCALE = 2.2

// ── 3-D helpers ─────────────────────────────────────────────────────────────

type Vec3 = [number, number, number]

function latLngToXYZ(lat: number, lng: number): Vec3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return [
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ]
}

function rotateY(
  x: number,
  y: number,
  z: number,
  phi: number
): Vec3 {
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  return [x * cos + z * sin, y, -x * sin + z * cos]
}

function rotateX(
  x: number,
  y: number,
  z: number,
  theta: number
): Vec3 {
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  return [x, y * cos - z * sin, y * sin + z * cos]
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const from = normalize(a)
  const to = normalize(b)
  const cosTheta = clamp(dot(from, to), -1, 1)
  if (cosTheta > 0.9995) {
    return normalize([
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    ])
  }
  const theta = Math.acos(cosTheta)
  const sinTheta = Math.sin(theta)
  const w1 = Math.sin((1 - t) * theta) / sinTheta
  const w2 = Math.sin(t * theta) / sinTheta
  return [
    from[0] * w1 + to[0] * w2,
    from[1] * w1 + to[1] * w2,
    from[2] * w1 + to[2] * w2,
  ]
}

function withAlpha(color: string, alpha: number): string {
  const match = color.match(/rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)/)
  if (!match) return color
  return `rgba(${match[1]},${match[2]},${match[3]},${clamp(alpha, 0, 1).toFixed(3)})`
}

/** Orthographic projection → canvas pixel {x, y, visible} */
function projectXYZ(
  point: Vec3,
  phi: number,
  theta: number,
  size: number,
  scaleMultiplier: number
): { x: number; y: number; visible: boolean } {
  let [x, y, z] = point
  ;[x, y, z] = rotateY(x, y, z, phi)
  ;[x, y, z] = rotateX(x, y, z, theta)
  const scale = size / 2
  const s = 0.97 * scaleMultiplier
  return {
    x: scale + x * scale * s,
    y: scale + y * scale * s,
    visible: z >= 0,
  }
}

// ── Active arc with timestamp ─────────────────────────────────────────────────

type ActiveArc = TrafficArc & { startTime: number }

// ── Component ────────────────────────────────────────────────────────────────

export default function Globe({ className = "", arcs = [] }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const phiRef = useRef(0)
  const thetaRef = useRef(0.25)
  const scaleRef = useRef(1.2)
  const sizeRef = useRef(500)
  const pointerRef = useRef({ x: 0, y: 0, down: false })
  const activeArcsRef = useRef<ActiveArc[]>([])
  const rafRef = useRef<number | null>(null)
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null)

  // Sync incoming arcs into active arcs list
  const seenIdsRef = useRef(new Set<string>())
  arcs.forEach((arc) => {
    if (!seenIdsRef.current.has(arc.id)) {
      seenIdsRef.current.add(arc.id)
      activeArcsRef.current.push({ ...arc, startTime: performance.now() })
    }
  })

  // ── Arc overlay render loop ───────────────────────────────────────────────
  const drawArcs = useCallback(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    const ctx = overlay.getContext("2d")
    if (!ctx) return

    const size = overlay.width
    const phi = phiRef.current
    const theta = thetaRef.current
    const zoom = scaleRef.current
    const now = performance.now()

    ctx.clearRect(0, 0, size, size)

    // Prune expired arcs
    activeArcsRef.current = activeArcsRef.current.filter(
      (a) => now - a.startTime < ARC_DURATION + 400
    )

    for (const arc of activeArcsRef.current) {
      const elapsed = now - arc.startTime
      const progress = Math.min(elapsed / ARC_DURATION, 1)
      const opacity = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1
      const src3 = latLngToXYZ(arc.srcLat, arc.srcLng)
      const dst3 = latLngToXYZ(arc.dstLat, arc.dstLng)
      const chord = clamp(1 - dot(normalize(src3), normalize(dst3)), 0, 2)
      const arcHeight = 0.08 + chord * 0.28

      // Draw great-circle arc up to progress.
      const SAMPLES = 56
      const limit = Math.floor(progress * SAMPLES)
      if (limit < 2) continue

      let hasVisiblePoint = false
      ctx.beginPath()
      for (let i = 0; i <= limit; i++) {
        const t = i / SAMPLES
        const curve = slerp(src3, dst3, t)
        const altitude = 1 + Math.sin(Math.PI * t) * arcHeight
        const point: Vec3 = [curve[0] * altitude, curve[1] * altitude, curve[2] * altitude]
        const pt = projectXYZ(point, phi, theta, size, zoom)
        if (pt.visible) hasVisiblePoint = true
        if (i === 0) ctx.moveTo(pt.x, pt.y)
        else ctx.lineTo(pt.x, pt.y)
      }
      if (!hasVisiblePoint) continue

      const baseColor = arc.color
      ctx.strokeStyle = withAlpha(baseColor, opacity * 0.82)
      ctx.lineWidth = 1.5
      ctx.shadowBlur = 0
      ctx.stroke()

      // Glowing head dot at current progress position
      if (progress < 1) {
        const headCurve = slerp(src3, dst3, progress)
        const headAltitude = 1 + Math.sin(Math.PI * progress) * arcHeight
        const head = projectXYZ(
          [headCurve[0] * headAltitude, headCurve[1] * headAltitude, headCurve[2] * headAltitude],
          phi,
          theta,
          size,
          zoom
        )
        if (!head.visible) continue
        const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 5)
        grd.addColorStop(0, withAlpha(baseColor, opacity))
        grd.addColorStop(1, withAlpha(baseColor, 0))
        ctx.beginPath()
        ctx.arc(head.x, head.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
      }
    }

    rafRef.current = requestAnimationFrame(drawArcs)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas || !overlay) return

    // Derive size from parent
    const parent = canvas.parentElement!
    const updateSize = () => {
      const size = Math.min(parent.clientWidth, parent.clientHeight) || 500
      sizeRef.current = size
      canvas.width = size
      canvas.height = size
      overlay.width = size
      overlay.height = size
    }
    updateSize()

    // Pointer handlers for drag-rotate
    const onPointerDown = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY, down: true }
      overlay.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerRef.current.down) return
      const size = sizeRef.current
      const dx = (e.clientX - pointerRef.current.x) / size
      const dy = (e.clientY - pointerRef.current.y) / size
      phiRef.current += dx * Math.PI * 2
      thetaRef.current = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, thetaRef.current - dy * Math.PI)
      )
      pointerRef.current = { x: e.clientX, y: e.clientY, down: true }
    }
    const onPointerUp = () => {
      pointerRef.current.down = false
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const direction = e.deltaY > 0 ? -1 : 1
      const next = scaleRef.current * (1 + direction * 0.08)
      scaleRef.current = clamp(next, MIN_SCALE, MAX_SCALE)
    }

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(parent)

    overlay.addEventListener("pointerdown", onPointerDown)
    overlay.addEventListener("pointermove", onPointerMove)
    overlay.addEventListener("pointerup", onPointerUp)
    overlay.addEventListener("pointercancel", onPointerUp)
    overlay.addEventListener("wheel", onWheel, { passive: false })

    // Create COBE globe
    globeRef.current = createGlobe(canvas, {
      devicePixelRatio: window.devicePixelRatio || 1,
      width: sizeRef.current,
      height: sizeRef.current,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 0.25,
      diffuse: 1.4,
      mapSamples: 16_000,
      mapBrightness: 3.2,
      baseColor: [0.36, 0.5, 0.76],
      markerColor: [0.3, 0.9, 0.6],
      glowColor: [0.45, 0.65, 0.95],
      markers: [],
      onRender: (state) => {
        if (!pointerRef.current.down) {
          phiRef.current += PHI_SPEED
        }
        state.width = sizeRef.current
        state.height = sizeRef.current
        state.phi = phiRef.current
        state.theta = thetaRef.current
        state.scale = scaleRef.current
      },
    })

    // Start arc overlay loop
    rafRef.current = requestAnimationFrame(drawArcs)

    return () => {
      resizeObserver.disconnect()
      overlay.removeEventListener("pointerdown", onPointerDown)
      overlay.removeEventListener("pointermove", onPointerMove)
      overlay.removeEventListener("pointerup", onPointerUp)
      overlay.removeEventListener("pointercancel", onPointerUp)
      overlay.removeEventListener("wheel", onWheel)
      globeRef.current?.destroy()
      globeRef.current = null
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [drawArcs])

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: "1 / 1" }}>
      {/* COBE WebGL globe */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Arc overlay — pointer events on top for drag */}
      <canvas ref={overlayRef} className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />
    </div>
  )
}
