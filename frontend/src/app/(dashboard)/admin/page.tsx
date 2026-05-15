"use client"

import { ShieldCheck } from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"

const ADMIN_SECTIONS = [
  {
    title: "사용자 · 권한 관리",
    items: ["회원 상태", "역할/권한", "신고 사용자", "운영자 계정"],
  },
  {
    title: "음원 · 경연 운영",
    items: ["제출 음원 검수", "경진대회 편성", "심사/투표 정책", "차트 노출 관리"],
  },
  {
    title: "AI 운영",
    items: ["AI 작업 큐", "프롬프트 템플릿", "모델/Provider 설정", "쿼터/비용 모니터링"],
  },
  {
    title: "수익 · 정산 운영",
    items: ["크레딧/결제", "환불", "유통 상태", "정산 승인", "권리/저작권 이슈"],
  },
  {
    title: "콘텐츠 · 시스템",
    items: ["공지/배너", "장르 taxonomy", "운영 로그", "장애/모니터링"],
  },
]

export default function AdminPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === "admin"

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-[720px] rounded border border-[var(--line)] bg-[var(--card)] p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 size-8 text-[var(--ink-3)]" />
        <h1 className="text-[20px] font-black">관리자 전용 메뉴</h1>
        <p className="mt-2 text-[13px] text-[var(--ink-3)]">
          운영성 기능은 일반 사용자 메뉴에서 분리되어 관리자 권한에서만 접근합니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-black">관리자 메뉴</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-3)]">
            사용자 경험과 분리된 운영, 심사, 정산, AI 관리 기능의 진입점입니다.
          </p>
        </div>
        <span className="rounded border border-[var(--green)] bg-[var(--green-bg)] px-3 py-1 text-[12px] font-black text-[var(--green-l)]">
          Admin
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ADMIN_SECTIONS.map((section) => (
          <section key={section.title} className="rounded border border-[var(--line)] bg-[var(--card)] p-5">
            <h2 className="text-[14px] font-black">{section.title}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {section.items.map((item) => (
                <span key={item} className="rounded border border-[var(--line)] bg-[var(--tint)] px-2.5 py-1 text-[12px] text-[var(--ink-2)]">
                  {item}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
