"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth.store"

const NAV = [
  { href: "/dashboard", label: "대시보드", icon: "⊞" },
  { href: "/submit", label: "음원 제출", icon: "⬆" },
  { href: "/submissions", label: "내 제출", icon: "♪" },
  { href: "/rankings", label: "랭킹", icon: "🏆" },
  { href: "/personas", label: "페르소나", icon: "★" },
  { href: "/credits", label: "크레딧", icon: "◎" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen border-r border-[var(--border)] bg-[var(--card)] shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--border)]">
        <span className="text-lg font-black tracking-tight" style={{ color: "var(--brand)" }}>
          Vertual Owl
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "text-white"
                  : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--secondary)]"
              )}
              style={active ? { background: "var(--brand)" } : undefined}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "var(--brand)" }}>
              {user.nickname[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.nickname}</p>
              <p className="text-xs text-[var(--text-muted)]">크레딧 {user.credit_balance}개</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
