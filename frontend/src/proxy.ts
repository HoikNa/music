import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_PREFIX = "/admin"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("refresh_token")?.value

  const isAdmin = pathname.startsWith(ADMIN_PREFIX)

  // Admin routes are still blocked at the edge; app routes use AuthGate so
  // login can navigate immediately with the in-memory access token.
  if (isAdmin && !token) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // 로그인 상태 + auth 페이지 → 대시보드
  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
