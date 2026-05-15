"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuthStore } from "@/stores/auth.store"

const HOME_GNB = [
  { href: "/explore", label: "탐색" },
  { href: "/ai-studio", label: "AI 창작" },
  { href: "/creator-studio", label: "창작 스튜디오" },
  { href: "/submit", label: "AI 심사" },
  { href: "/rankings", label: "Owl 차트" },
  { href: "/contest", label: "경진대회" },
]

export function HomeHeader() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuthStore()

  async function handleLogout() {
    try {
      await api.post("/auth/logout", {})
    } catch {
      // Ignore network/session cleanup errors and clear local state.
    }
    logout()
    toast.success("로그아웃되었습니다")
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(11,13,15,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-[1200px] flex-wrap items-center gap-3 px-4 py-2 sm:h-14 sm:flex-nowrap sm:gap-4 sm:py-0">
        <Link href="/" className="flex shrink-0 items-center gap-1 sm:mr-2">
          <span className="text-[22px] font-black tracking-tight text-[var(--ink-0)]">Vertual</span>
          <span className="text-[22px] font-black tracking-tight text-[var(--green)]">Owl</span>
        </Link>
        <div className="order-3 flex h-9 w-full min-w-0 basis-full items-center gap-2 rounded border border-[var(--line)] bg-[var(--tint)] px-3 transition-colors focus-within:border-[var(--green)] focus-within:bg-[var(--card)] sm:order-none sm:max-w-[480px] sm:flex-1 sm:basis-auto">
          <Search className="size-4 shrink-0 text-[var(--ink-3)]" />
          <input
            className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[var(--ink-3)]"
            placeholder="노래, 아티스트, 경연 검색"
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-8 rounded bg-[var(--tint)] sm:w-24" aria-label="세션 확인 중" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-[13px] font-medium text-[var(--ink-1)] hover:text-[var(--ink-0)] sm:inline"
              >
                {user.nickname}
              </Link>
              <Link
                href="/submit"
                className="rounded bg-[var(--green)] px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--green-d)]"
              >
                AI심사
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[13px] font-medium text-[var(--ink-2)] hover:text-[var(--ink-0)]"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[13px] font-medium text-[var(--ink-1)] hover:text-[var(--ink-0)]">
                로그인
              </Link>
              <Link
                href="/register"
                className="hidden rounded bg-[var(--green)] px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--green-d)] sm:inline-block"
              >
                무료 시작
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-[var(--line-soft)] bg-[rgba(11,13,15,0.72)]">
        <nav className="mx-auto flex h-10 max-w-[1200px] items-end gap-5 overflow-x-auto px-4 sm:gap-6">
          {HOME_GNB.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="gnb-link whitespace-nowrap border-b-2 border-transparent pb-2.5 text-[14px] font-medium text-[var(--ink-1)] hover:text-[var(--ink-0)]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
