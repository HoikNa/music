"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/stores/auth.store"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const GNB = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/explore", label: "탐색" },
  { href: "/ai-studio", label: "AI 창작" },
  { href: "/creator-studio", label: "창작 스튜디오" },
  { href: "/submit", label: "AI 심사" },
  { href: "/rankings", label: "Owl 차트" },
  { href: "/contest", label: "경진대회" },
  { href: "/submissions", label: "마이뮤직" },
  { href: "/distribution", label: "내 수익" },
  { href: "/credits", label: "크레딧" },
]

const ADMIN_GNB = [
  { href: "/admin", label: "관리자" },
]

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  async function handleLogout() {
    try { await api.post("/auth/logout", {}) } catch { /* 무시 */ }
    logout()
    toast.success("로그아웃되었습니다")
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(11,13,15,0.92)] backdrop-blur-xl">
      {/* Top row: logo + search + user */}
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-4">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-1.5 shrink-0 mr-2">
          <span className="text-[22px] font-black tracking-tight text-[var(--ink-0)]">Vertual</span>
          <span className="text-[22px] font-black tracking-tight text-[var(--green)]">Owl</span>
        </Link>

        {/* Search */}
        <div className="flex flex-1 max-w-[480px] items-center gap-2 rounded border border-[var(--line)] bg-[var(--tint)] px-3 h-9 focus-within:border-[var(--green)] focus-within:bg-[var(--card)] transition-colors">
          <Search className="size-4 text-[var(--ink-3)] shrink-0" />
          <input
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--ink-3)]"
            placeholder="노래, 아티스트, 경연 검색"
          />
        </div>

        {/* User controls */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 items-center gap-2 rounded border border-[var(--line)] bg-[var(--card)] py-1 pl-1 pr-3 text-[13px] hover:border-[var(--green)] transition-colors">
                <div className="flex size-6 items-center justify-center rounded-full bg-[var(--green)] text-[10px] font-bold text-white">
                  {user.nickname.slice(0, 2)}
                </div>
                <span className="hidden font-medium text-[var(--ink-0)] sm:block">{user.nickname}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem disabled className="text-xs text-[var(--text-muted)]">
                  크레딧 {user.credit_balance}개
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/submissions")}>마이뮤직</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/credits")}>크레딧 충전</DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>관리자 메뉴</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-[var(--error)]">로그아웃</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className="text-[13px] font-medium text-[var(--ink-1)] hover:text-[var(--ink-0)]">로그인</Link>
              <Link href="/register" className="rounded text-[13px] font-semibold bg-[var(--green)] text-white px-3 py-1.5 hover:bg-[var(--green-d)] transition-colors">
                무료 시작
              </Link>
            </>
          )}
        </div>
      </div>

      {/* GNB row */}
      <div className="border-t border-[var(--line-soft)] bg-[rgba(11,13,15,0.72)]">
        <nav className="mx-auto flex h-10 max-w-[1200px] items-end gap-5 overflow-x-auto px-4 sm:gap-6">
          {[...GNB, ...(user?.role === "admin" ? ADMIN_GNB : [])].map(({ href, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn("gnb-link", active && "active")}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
