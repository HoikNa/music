import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_PREFIX = "/admin"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("refresh_token")?.value

  const isDashboard = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/ai-studio") ||
    pathname.startsWith("/creator-studio") ||
    pathname.startsWith("/contest") ||
    pathname.startsWith("/distribution") ||
    pathname.startsWith("/explore") ||
    pathname.startsWith("/submit") ||
    pathname.startsWith("/submissions") ||
    pathname.startsWith("/rankings") ||
    pathname.startsWith("/personas") ||
    pathname.startsWith("/credits")
  const isAdmin = pathname.startsWith(ADMIN_PREFIX)

  // 미로그인 + 보호 경로 → 로그인
  if ((isDashboard || isAdmin) && !token) {
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
