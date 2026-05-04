"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AudioWaveform,
  BarChart2,
  Compass,
  FileAudio,
  Home,
  Mic2,
  Sparkles,
  Trophy,
  Upload,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth.store"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home, group: "Workspace" },
  { href: "/ai-studio", label: "AI Studio", icon: Sparkles, group: "Workspace" },
  { href: "/creator-studio", label: "Creator Studio", icon: AudioWaveform, group: "Workspace" },
  { href: "/contest", label: "Contest", icon: Trophy, group: "Network" },
  { href: "/distribution", label: "Distribution", icon: Upload, group: "Network" },
  { href: "/explore", label: "Explore", icon: Compass, group: "Network" },
  { href: "/submissions", label: "내 제출", icon: FileAudio, group: "Library" },
  { href: "/rankings", label: "랭킹", icon: BarChart2, group: "Library" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const groups = Array.from(new Set(NAV.map((item) => item.group)))

  return (
    <aside className="hidden min-h-screen w-[var(--sidebar-w)] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--card)] lg:flex">
      <div className="flex h-[var(--topbar-h)] items-center gap-3 border-b border-[var(--line)] px-5">
        <div className="flex size-8 items-center justify-center rounded-[10px] bg-[var(--ink-0)] text-[var(--paper)] shadow-[var(--sh-sm)]">
          <Mic2 className="size-4" />
        </div>
        <div>
          <div className="font-serif text-[19px] leading-none text-[var(--ink-0)]">Vertual Owl</div>
          <div className="label-mono mt-1 text-[9px]">Creator OS</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        {groups.map((group) => (
          <div key={group} className="mb-7">
            <div className="label-mono px-3 pb-2">{group}</div>
            <div className="space-y-1">
              {NAV.filter((item) => item.group === group).map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-[var(--ink-0)] text-[var(--paper)] shadow-[var(--sh-sm)]"
                        : "text-[var(--ink-2)] hover:bg-[var(--tint)] hover:text-[var(--ink-0)]"
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="flex-1">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--line)] p-4">
        <Link href="/credits" className="block rounded-[14px] border border-[var(--line)] bg-[var(--tint)] p-4">
          <div className="flex items-center justify-between">
            <div className="label-mono">Credits</div>
            <Wallet className="size-3.5 text-[var(--ink-3)]" />
          </div>
          <div className="mt-3 font-mono text-2xl text-[var(--ink-0)]">{user?.credit_balance ?? 0}</div>
          <div className="vo-progress mt-3">
            <span style={{ width: `${Math.min(((user?.credit_balance ?? 0) / 200) * 100, 100)}%` }} />
          </div>
          <div className="mt-3 text-xs font-medium text-[var(--amber-d)]">
            크레딧 충전
          </div>
        </Link>
        {user && (
          <div className="mt-3 flex items-center gap-3 rounded-[12px] bg-[var(--card)] px-1 py-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-[var(--ink-0)] text-[10px] font-semibold text-[var(--paper)]">
              {user.nickname.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[var(--ink-0)]">{user.nickname}</p>
              <p className="text-[11px] text-[var(--ink-3)]">creator account</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
