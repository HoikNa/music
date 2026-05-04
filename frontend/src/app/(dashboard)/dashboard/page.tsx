"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { queryKeys } from "@/lib/queryKeys"
import { api } from "@/lib/api"
import { useAuthStore } from "@/stores/auth.store"
import type { PagedResponse, Submission, WeeklyRanking } from "@/types/api"

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: submissionsData, isLoading: subLoading } = useQuery({
    queryKey: queryKeys.submissions.mine(),
    queryFn: () => api.get<PagedResponse<Submission>>("/submissions"),
  })

  const { data: ranking } = useQuery({
    queryKey: queryKeys.rankings.weekly(),
    queryFn: () => api.get<WeeklyRanking>("/rankings/weekly"),
  })

  const recentSubs = submissionsData?.items.slice(0, 3) ?? []
  const myRank = ranking?.my_entry

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl p-6 border border-[var(--border)]"
        style={{ background: "linear-gradient(135deg, var(--card) 0%, #1e1845 100%)" }}>
        <p className="text-sm text-[var(--text-muted)] mb-1">안녕하세요,</p>
        <h1 className="text-2xl font-black mb-3">{user?.nickname ?? "..."} 님</h1>
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-[var(--text-muted)]">크레딧</p>
            <p className="font-bold text-lg" style={{ color: "var(--accent)" }}>{user?.credit_balance ?? 0}개</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">총 제출</p>
            <p className="font-bold text-lg">{submissionsData?.items.length ?? 0}회</p>
          </div>
          {myRank && (
            <div>
              <p className="text-[var(--text-muted)]">이번 주 순위</p>
              <p className="font-bold text-lg" style={{ color: "var(--brand)" }}>{myRank.rank}위</p>
            </div>
          )}
        </div>
        <div className="mt-4">
          <Link href="/submit">
            <Button style={{ background: "var(--brand)" }}>+ 지금 도전하기</Button>
          </Link>
        </div>
      </div>

      {/* Recent Submissions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">최근 제출</h2>
          <Link href="/submissions" className="text-xs" style={{ color: "var(--brand)" }}>전체 보기</Link>
        </div>
        {subLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : recentSubs.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] text-sm border border-dashed border-[var(--border)] rounded-xl">
            아직 제출한 음원이 없습니다
          </div>
        ) : (
          <div className="space-y-2">
            {recentSubs.map((sub) => (
              <Link key={sub.id} href={`/submissions/${sub.id}`}>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--brand-light)] transition-colors">
                  <div>
                    <p className="font-medium text-sm">{sub.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(sub.created_at).toLocaleDateString("ko-KR")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{sub.status === "scored" ? "완료" : "처리중"}</Badge>
                    {sub.base_score && (
                      <span className="font-bold text-sm" style={{ color: "var(--accent)" }}>
                        {sub.base_score.total.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/rankings", label: "랭킹 확인", icon: "🏆" },
          { href: "/personas", label: "페르소나 소개", icon: "★" },
          { href: "/credits", label: "크레딧 충전", icon: "◎" },
        ].map(({ href, label, icon }) => (
          <Link key={href} href={href}>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center hover:border-[var(--brand-light)] transition-colors">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
