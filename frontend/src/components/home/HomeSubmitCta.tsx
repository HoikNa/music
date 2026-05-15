"use client"

import Link from "next/link"
import { useAuthStore } from "@/stores/auth.store"

export function HomeSubmitCta() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="rounded border border-[var(--line)] p-4 text-center">
        <div className="mx-auto mb-2 h-4 w-28 rounded bg-[var(--tint)]" />
        <div className="mx-auto mb-3 h-3 w-40 rounded bg-[var(--tint)]" />
        <div className="h-9 rounded bg-[var(--tint)]" />
      </div>
    )
  }

  return (
    <div className="rounded border border-[var(--line)] p-4 text-center">
      <p className="mb-1 text-[13px] font-bold">{user ? "다음 제출을 준비하세요" : "첫 도전은 무료!"}</p>
      <p className="mb-3 text-[12px] text-[var(--ink-3)]">
        {user ? `보유 크레딧 ${user.credit_balance}개` : "가입 즉시 크레딧 10개 지급"}
      </p>
      <Link
        href={user ? "/submit" : "/register"}
        className="block rounded bg-[var(--green)] py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[var(--green-d)]"
      >
        {user ? "새 제출하기" : "무료 회원가입"}
      </Link>
    </div>
  )
}
