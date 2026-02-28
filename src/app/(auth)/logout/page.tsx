"use client"

import * as React from "react"
import Image from "next/image"
import { signOut } from "next-auth/react"

export default function LogoutPage() {
  const [stage, setStage] = React.useState<"signing-out" | "done" | "fade">("signing-out")

  React.useEffect(() => {
    let cancelled = false
    let doneTimeout: ReturnType<typeof setTimeout> | null = null
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null

    const hardRedirect = (url: string) => {
      if (cancelled) return
      window.location.replace(url)
    }

    void signOut({ redirect: false, redirectTo: "/auth" })
      .then((result) => {
        if (cancelled) return
        setStage("done")
        doneTimeout = setTimeout(() => {
          if (cancelled) return
          setStage("fade")
          redirectTimeout = setTimeout(() => {
            hardRedirect(result.url || "/auth")
          }, 800)
        }, 1200)
      })
      .catch(() => {
        void fetch("/api/logout", { method: "POST" }).finally(() => {
          hardRedirect("/auth")
        })
      })

    return () => {
      cancelled = true
      if (doneTimeout) clearTimeout(doneTimeout)
      if (redirectTimeout) clearTimeout(redirectTimeout)
    }
  }, [])

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center transition-opacity duration-700"
      style={{ opacity: stage === "fade" ? 0 : 1 }}
    >
      <div className="flex flex-col items-center">
        {/* Avatar with ring animation */}
        <div className="relative mb-8">
          {/* Spinning ring */}
          <div
            className="absolute -inset-2 rounded-full transition-opacity duration-500"
            style={{ opacity: stage === "signing-out" ? 1 : 0 }}
          >
            <svg className="size-full animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-border"
              />
              <circle
                cx="40"
                cy="40"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="60 180"
                strokeLinecap="round"
                className="text-foreground/40"
              />
            </svg>
          </div>

          {/* Checkmark ring */}
          <div
            className="absolute -inset-2 flex items-center justify-center rounded-full transition-opacity duration-500"
            style={{ opacity: stage === "done" ? 1 : 0 }}
          >
            <svg className="size-full" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-foreground/20"
              />
            </svg>
          </div>

          <Image
            src="/goodbye.png"
            alt="Goodbye"
            width={56}
            height={56}
            className="size-14 object-contain"
          />

          {/* Checkmark overlay */}
          <div
            className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-foreground transition-all duration-500"
            style={{
              opacity: stage === "done" ? 1 : 0,
              transform: stage === "done" ? "scale(1)" : "scale(0.5)",
            }}
          >
            <svg className="size-3 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-sm font-medium tracking-tight">
            {stage === "signing-out" ? "Signing you out" : "You\u2019ve been signed out"}
          </p>

          {/* Animated dots — only during signing out */}
          {stage === "signing-out" && (
            <span className="inline-flex gap-0.5 mt-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1 rounded-full bg-muted-foreground/50 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms`, animationDuration: "1s" }}
                />
              ))}
            </span>
          )}

          {stage !== "signing-out" && (
            <p className="mt-1.5 text-xs text-muted-foreground animate-in fade-in duration-500">
              Redirecting to sign in...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
