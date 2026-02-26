"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from "react"

function formatSegment(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  // On mobile (< 2 segments shown), show only last segment
  // On desktop, show all segments
  const showMobileOnly = segments.length > 1

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {/* Home - hidden on mobile when there are nested segments */}
        <BreadcrumbItem className={showMobileOnly ? "hidden sm:flex" : ""}>
          {segments.length === 0 ? (
            <BreadcrumbPage>Home</BreadcrumbPage>
          ) : (
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/")
          const label = formatSegment(segment)
          const isLast = index === segments.length - 1
          // On mobile with many segments, hide middle ones
          const hideOnMobile = showMobileOnly && !isLast

          return (
            <Fragment key={href}>
              <BreadcrumbSeparator className={hideOnMobile ? "hidden sm:flex" : ""} />
              <BreadcrumbItem className={hideOnMobile ? "hidden sm:flex" : "truncate"}>
                {isLast ? (
                  <BreadcrumbPage className="truncate">{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
