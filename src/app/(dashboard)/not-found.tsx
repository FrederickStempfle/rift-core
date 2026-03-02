"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"

export default function DashboardNotFound() {
  const router = useRouter()

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-32">
      <p className="text-sm font-medium text-muted-foreground mb-3">404</p>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-8">
        This page doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-3.5" />
          Go back
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <Home className="size-3.5" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
