"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { AlertTriangle, FileAudio, Loader2, RefreshCw, ShieldCheck, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScoreBar } from "@/components/common/ScoreBar"
import { StatusStep } from "@/components/submission/StatusStep"
import { FeedbackCard } from "@/components/submission/FeedbackCard"
import { queryKeys } from "@/lib/queryKeys"
import { api } from "@/lib/api"
import { musicGenreLabel } from "@/lib/musicGenres"
import type { Submission } from "@/types/api"

const BASE_DIMENSIONS = ["pitch", "rhythm", "range", "dynamic", "articulation"] as const
const PENDING_AUDIO_STATUSES = new Set(["queued", "running"])

function hasPendingFeedbackAudio(submission?: Submission) {
  return Boolean(
    submission?.persona_scores.some((personaScore) =>
      personaScore.feedback && PENDING_AUDIO_STATUSES.has(personaScore.feedback.audio_status)
    )
  )
}

function abuseCounts(flags?: Record<string, unknown> | null) {
  const counts = flags?.counts
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) return null
  return counts as Record<string, number>
}

function exceededScopes(flags?: Record<string, unknown> | null) {
  const exceeded = flags?.exceeded
  if (!Array.isArray(exceeded)) return []
  return exceeded.filter((scope): scope is string => typeof scope === "string")
}

function riskPercent(value?: number) {
  return Math.round((value ?? 0) * 100)
}

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: submission, isLoading, isFetching, refetch } = useQuery({
    queryKey: queryKeys.submissions.detail(id),
    queryFn: () => api.get<Submission>(`/submissions/${id}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (hasPendingFeedbackAudio(query.state.data)) return 3000
      if (!status || status === "scored" || status === "rejected") return false
      return 3000
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)]">
        <FileAudio className="mx-auto mb-3 size-10 text-[var(--text-disabled)]" />
        <p>제출 내역을 찾을 수 없습니다</p>
        <Link href="/submissions" className="mt-4 inline-block">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    )
  }

  const isProcessing = submission.status === "pending" || submission.status === "validating" || submission.status === "scoring"
  const audioPending = hasPendingFeedbackAudio(submission)
  const audioReadyCount = submission.persona_scores.filter((ps) => Boolean(ps.feedback?.audio_url)).length
  const counts = abuseCounts(submission.abuse_flags)
  const exceeded = exceededScopes(submission.abuse_flags)
  const abuseStatus = typeof submission.abuse_flags?.status === "string" ? submission.abuse_flags.status : null
  const showOperationFlags = Boolean(submission.abuse_flags || submission.is_ranking_excluded || (submission.abuse_risk_score ?? 0) > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{submission.title}</h1>
            <Badge variant="secondary">{submission.genre_label ?? musicGenreLabel(submission.genre)}</Badge>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {new Date(submission.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/submit">
          <Button variant="outline" size="sm">다시 도전</Button>
        </Link>
      </div>

      {/* 처리 중 */}
      {isProcessing && (
        <div className="app-card space-y-4 p-6">
          <p className="font-semibold text-sm">채점이 진행 중입니다...</p>
          <StatusStep status={submission.status} />
          <p className="text-xs text-[var(--text-muted)]">평균 30초 내 완료됩니다. 페이지를 닫아도 결과는 저장됩니다.</p>
        </div>
      )}

      {/* 반려 */}
      {submission.status === "rejected" && (
        <Alert style={{ borderColor: "var(--error)" }}>
          <AlertDescription className="text-sm">
            <span className="font-bold">반려 사유: </span>{submission.reject_reason}
          </AlertDescription>
        </Alert>
      )}

      {showOperationFlags && (
        <div className="app-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">운영 플래그</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">abuse window · {abuseStatus ?? "unknown"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex h-7 items-center gap-1.5 rounded border px-2.5 text-[11px] font-medium"
                style={{
                  borderColor: submission.is_ranking_excluded ? "var(--error)" : "var(--success)",
                  color: submission.is_ranking_excluded ? "var(--error)" : "var(--success)",
                }}
              >
                {submission.is_ranking_excluded ? <AlertTriangle className="size-3" /> : <ShieldCheck className="size-3" />}
                {submission.is_ranking_excluded ? "랭킹 제외" : "랭킹 포함"}
              </span>
              <span className="inline-flex h-7 items-center rounded border border-[var(--line)] px-2.5 font-mono text-[11px] text-[var(--ink-2)]">
                risk {riskPercent(submission.abuse_risk_score)}%
              </span>
            </div>
          </div>

          {counts && (
            <div className="grid gap-2 sm:grid-cols-4">
              {Object.entries(counts).map(([scope, count]) => (
                <div key={scope} className="rounded border border-[var(--line)] bg-[var(--tint)] p-3">
                  <div className="metric-label">{scope}</div>
                  <div className="mt-1 font-mono text-lg font-bold text-[var(--ink-0)]">{count}</div>
                </div>
              ))}
            </div>
          )}

          {exceeded.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {exceeded.map((scope) => (
                <span key={scope} className="rounded border border-[var(--error)] px-2 py-1 text-[11px] font-medium text-[var(--error)]">
                  exceeded · {scope}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 기본기 점수 */}
      {submission.base_score && (
        <div className="app-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold">기본기 채점 결과</h2>
            <div className="text-3xl font-black tabular-nums" style={{ color: "var(--accent)" }}>
              {submission.base_score.total.toFixed(1)}
              <span className="text-base font-normal text-[var(--text-muted)]"> / 20</span>
            </div>
          </div>
          <div className="space-y-3">
            {BASE_DIMENSIONS.map((dim) => (
              <ScoreBar
                key={dim}
                dimension={dim}
                score={submission.base_score![dim]}
              />
            ))}
          </div>
        </div>
      )}

      {/* 페르소나 피드백 */}
      {submission.persona_scores.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">페르소나 AI 심사</h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                {audioPending ? <Loader2 className="size-3 animate-spin" /> : <Volume2 className="size-3" />}
                음성 피드백 {audioReadyCount}/{submission.persona_scores.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex h-8 items-center gap-1.5 rounded border border-[var(--line)] px-3 text-xs font-medium text-[var(--ink-1)] transition-colors hover:border-[var(--ink-2)] disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} />
              새로고침
            </button>
          </div>
          {submission.persona_scores.map((ps) => (
            <FeedbackCard key={ps.persona_id} personaScore={ps} />
          ))}
        </div>
      )}

      {/* CTA */}
      {submission.status === "scored" && (
        <div className="flex gap-3">
          <Link href="/rankings" className="flex-1">
            <Button variant="outline" className="w-full">랭킹 확인</Button>
          </Link>
          <Link href="/submit" className="flex-1">
            <Button className="w-full" style={{ background: "var(--brand)" }}>다시 도전하기</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
