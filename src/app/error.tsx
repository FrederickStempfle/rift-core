"use client"

import { RotateCcw, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background to-muted/20" />

      <div className="relative w-full max-w-lg space-y-8 text-center">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-destructive/20 blur-2xl" />
            <div className="relative flex size-20 items-center justify-center rounded-2xl border border-destructive/20 bg-background shadow-lg shadow-destructive/5">
              <svg
                className="size-10 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Oops! Something went wrong
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            We encountered an unexpected error. Don't worry, it's not your fault.
            Try refreshing the page or head back to continue.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="lg" className="gap-2">
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <a href="/">
              <ArrowLeft className="size-4" />
              Go back home
            </a>
          </Button>
        </div>

        <div className="pt-4">
          <p className="text-xs text-muted-foreground">
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  )
}
