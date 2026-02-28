import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/lib/auth"

const publicPaths = ["/auth", "/logout", "/terms", "/privacy", "/pricing"]

const isPublicPath = (pathname: string) =>
  publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

export default auth((req: NextRequest & { auth: unknown }) => {
  const { nextUrl } = req

  const isAuthenticated = Boolean(req.auth)

  if (isPublicPath(nextUrl.pathname)) {
    if (isAuthenticated && nextUrl.pathname === "/auth") {
      return NextResponse.redirect(new URL("/", nextUrl))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(
      new URL(`/auth?callbackUrl=${callbackUrl}`, nextUrl)
    )
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api/auth|api/logout|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
}
