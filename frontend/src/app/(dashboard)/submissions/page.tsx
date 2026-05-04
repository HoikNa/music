"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusStep } from "@/components/submission/StatusStep"
import { queryKeys } from "@/lib/queryKeys"
import { api } from "@/lib/api"
import type { Submission, PagedResponse } from "@/types/api"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "대기중", color: "var(--text-muted)" },
  validating: { label: "검증중", color: "var(--info)" },
  scoring: { label: "채점중", color: "var(--warning)" },
  scored: { label: "완료", color: "var(--success)" },
  rejected: { label: "반려", color: "var(--error)" },
}

export default function SubmissionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.submissions.mine(),
    queryFn: () => api.get<PagedResponse<Submission>>("/submissions"),
  })

  const submissions = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 제출</h1>
        <Link href="/submit">
          <Button style={{ background: "var(--brand)" }}>+ 새 제출</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-xl">
          <p className="text-4xl mb-4">🎵</p>
          <p className="font-medium">아직 제출한 음원이 없습니다</p>
          <p className="text-sm mt-1 mb-6">첫 번째 음원을 제출해보세요</p>
          <Link href="/submit">
            <Button style={{ background: "var(--brand)" }}>음원 제출하기</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const st = STATUS_LABELS[sub.status]
            return (
              <Link key={sub.id} href={`/submissions/${sub.id}`}>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--brand-light)] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{sub.title}</p>
                        <Badge variant="secondary" className="text-xs">{sub.genre}</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {new Date(sub.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold mb-1" style={{ color: st.color }}>{st.label}</p>
                      {sub.base_score && (
                        <p className="text-lg font-black tabular-nums" style={{ color: "var(--accent)" }}>
                          {sub.base_score.total.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                  {sub.status !== "scored" && sub.status !== "rejected" && (
                    <div className="mt-4">
                      <StatusStep status={sub.status} />
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
