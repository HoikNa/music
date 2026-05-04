"use client"

import { usePathname, useRouter } from "next/navigation"
import { Bell, Search, Settings } from "lucide-react"
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

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const pageInfo = getPageInfo(pathname)

  async function handleLogout() {
    try {
      await api.post("/auth/logout", {})
    } catch { /* 무시 */ }
    logout()
    toast.success("로그아웃되었습니다")
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-40 flex h-[var(--topbar-h)] items-center gap-5 border-b border-[var(--line)] bg-[var(--card)] px-6">
      <div className="min-w-0 flex-1">
        <div className="label-mono">{pageInfo.crumb}</div>
        <div className="mt-0.5 text-[13px] font-medium text-[var(--ink-0)]">{pageInfo.title}</div>
      </div>

      <div className="hidden w-[280px] items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--tint)] px-3 py-2 text-[13px] text-[var(--ink-2)] transition-colors focus-within:border-[var(--amber-l)] focus-within:bg-[var(--card)] md:flex">
        <Search className="size-4" />
        <input
          className="w-full bg-transparent outline-none placeholder:text-[var(--ink-3)]"
          placeholder="Search catalog, contests, rights"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="relative flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--ink-2)] transition-colors hover:text-[var(--ink-0)]">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--amber)] ring-2 ring-[var(--card)]" />
        </button>
        <button className="flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--ink-2)] transition-colors hover:text-[var(--ink-0)]">
          <Settings className="size-4" />
        </button>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] py-1 pl-1 pr-3 transition-colors hover:border-[var(--amber-l)]">
              <div className="flex size-7 items-center justify-center rounded-full bg-[var(--ink-0)] text-[10px] font-semibold text-[var(--paper)]">
                {user.nickname.slice(0, 2)}
              </div>
              <span className="hidden text-[13px] font-medium text-[var(--ink-0)] sm:block">{user.nickname}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem disabled className="text-xs text-[var(--text-muted)]">
                크레딧 {user.credit_balance}개
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/credits")}>
                크레딧 충전
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-[var(--error)]">
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

function getPageInfo(pathname: string) {
  if (pathname.startsWith("/ai-studio")) return { title: "AI Studio", crumb: "Workspace · Generate" }
  if (pathname.startsWith("/creator-studio")) return { title: "Creator Studio", crumb: "Workspace · Session" }
  if (pathname.startsWith("/contest")) return { title: "Contest", crumb: "Network · Challenge" }
  if (pathname.startsWith("/distribution")) return { title: "Distribution", crumb: "Network · Release" }
  if (pathname.startsWith("/explore")) return { title: "Explore", crumb: "Network · Discovery" }
  if (pathname.startsWith("/submit")) return { title: "음원 제출", crumb: "Create · AI 심사 요청" }
  if (pathname.startsWith("/submissions")) return { title: "내 제출", crumb: "Library · 제출 이력" }
  if (pathname.startsWith("/rankings")) return { title: "랭킹 스코어보드", crumb: "Contest · Weekly Top 100" }
  if (pathname.startsWith("/personas")) return { title: "페르소나", crumb: "AI Judges · 취향 가중치" }
  if (pathname.startsWith("/credits")) return { title: "크레딧", crumb: "Billing · 사용량과 충전" }
  return { title: "Dashboard", crumb: "Workspace · Overview" }
}
