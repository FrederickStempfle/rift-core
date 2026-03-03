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

// ── 3-D helpers ─────────────────────────────────────────────────────────────

function latLngToXYZ(lat: number, lng: number): [number, number, number] {
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
): [number, number, number] {
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  return [x * cos + z * sin, y, -x * sin + z * cos]
}

/** Orthographic projection → canvas pixel {x, y, visible} */
function project(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
  size: number
): { x: number; y: number; visible: boolean } {
  let [x, y, z] = latLngToXYZ(lat, lng)
  ;[x, y, z] = rotateY(x, y, z, phi)
  // tilt by theta
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const y2 = y * cosT - z * sinT
  const z2 = y * sinT + z * cosT
  const scale = size / 2
  return {
    x: scale + x * scale * 0.97,
    y: scale + y2 * scale * 0.97,
    visible: z2 >= 0,
  }
}

/** Sample a point along a quadratic bezier at t ∈ [0,1] */
function bezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const mt = 1 - t
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
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

      const src = project(arc.srcLat, arc.srcLng, phi, theta, size)
      const dst = project(arc.dstLat, arc.dstLng, phi, theta, size)

      if (!src.visible && !dst.visible) continue

      // Control point: midpoint elevated outward
      const midLat = (arc.srcLat + arc.dstLat) / 2
      const midLng = (arc.srcLng + arc.dstLng) / 2
      // Push midpoint out radially
      const arcAlt = 0.35
      const [mx, my, mz] = latLngToXYZ(midLat, midLng)
      const factor = 1 + arcAlt
      const ctrl = project(
        midLat + (my * factor - my) * (180 / Math.PI),
        midLng,
        phi,
        theta,
        size
      )
      // Simple alternative: just lift the midpoint toward center of canvas
      const cpx = (src.x + dst.x) / 2 - (dst.y - src.y) * 0.35
      const cpy = (src.y + dst.y) / 2 + (dst.x - src.x) * 0.35 - size * 0.08
      void ctrl; void mx; void mz // suppress unused warnings

      // Draw arc path up to `progress` using ~40 samples
      const SAMPLES = 40
      const limit = Math.floor(progress * SAMPLES)
      if (limit < 2) continue

      const cp = { x: cpx, y: cpy }

      ctx.beginPath()
      const p0 = bezier(src, cp, dst, 0)
      ctx.moveTo(p0.x, p0.y)
      for (let i = 1; i <= limit; i++) {
        const pt = bezier(src, cp, dst, i / SAMPLES)
        ctx.lineTo(pt.x, pt.y)
      }

      const baseColor = arc.color
      ctx.strokeStyle = baseColor.replace(
        /rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/,
        `rgba($1,$2,$3,${(opacity * 0.85).toFixed(2)})`
      )
      ctx.lineWidth = 1.5
      ctx.shadowBlur = 0
      ctx.stroke()

      // Glowing head dot at current progress position
      if (progress < 1) {
        const head = bezier(src, cp, dst, progress)
        const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 5)
        grd.addColorStop(0, baseColor.replace(/,[^)]+\)/, `,${(opacity).toFixed(2)})`))
        grd.addColorStop(1, baseColor.replace(/,[^)]+\)/, `,0)`))
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
    const size = Math.min(parent.clientWidth, parent.clientHeight) || 500
    canvas.width = size
    canvas.height = size
    overlay.width = size
    overlay.height = size

    // Pointer handlers for drag-rotate
    const onPointerDown = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY, down: true }
      overlay.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerRef.current.down) return
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

    overlay.addEventListener("pointerdown", onPointerDown)
    overlay.addEventListener("pointermove", onPointerMove)
    overlay.addEventListener("pointerup", onPointerUp)

    // Create COBE globe
    globeRef.current = createGlobe(canvas, {
      devicePixelRatio: window.devicePixelRatio || 1,
      width: size,
      height: size,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 16_000,
      mapBrightness: 6,
      baseColor: [0.1, 0.12, 0.16],
      markerColor: [0.3, 0.9, 0.6],
      glowColor: [0.08, 0.08, 0.1],
      markers: [],
      onRender: (state) => {
        if (!pointerRef.current.down) {
          phiRef.current += PHI_SPEED
        }
        state.phi = phiRef.current
        state.theta = thetaRef.current
      },
    })

    // Start arc overlay loop
    rafRef.current = requestAnimationFrame(drawArcs)

    return () => {
      overlay.removeEventListener("pointerdown", onPointerDown)
      overlay.removeEventListener("pointermove", onPointerMove)
      overlay.removeEventListener("pointerup", onPointerUp)
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
