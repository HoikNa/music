"use client"

import Link from "next/link"
import { Trophy, Upload } from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"

export function HomeHero() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-lg">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-[var(--green-l)]">
        AI POWERED · K-VOCAL COMPETITION
      </p>
      <h1 className="mb-4 text-[30px] font-black leading-tight tracking-tight sm:text-[32px]">
        AI 심사로
        <br />
        <span className="text-[var(--green)]">당신의 실력을</span>
        <br className="sm:hidden" />
        <span className="text-[var(--green)] sm:ml-1">증명</span>하세요
      </h1>
      <p className="mb-6 text-[14px] leading-relaxed text-white/70">
        김범수, 아이유, 태양의 AI 페르소나가 심사합니다.
        <br />
        주간 TOP100 도전 — 가입 즉시 크레딧 10개 지급.
      </p>
      <div className="flex gap-3">
        <Link
          href={user ? "/submit" : "/register"}
          className="inline-flex items-center gap-2 rounded bg-[var(--green)] px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[var(--green-d)]"
        >
          <Upload className="size-4" />
          {user ? "새 제출하기" : "지금 도전하기"}
        </Link>
        <Link
          href={user ? "/dashboard" : "/rankings"}
          className="inline-flex items-center gap-2 rounded border border-white/30 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
        >
          <Trophy className="size-4" />
          {user ? "내 대시보드" : "차트 보기"}
        </Link>
      </div>
    </div>
  )
}
