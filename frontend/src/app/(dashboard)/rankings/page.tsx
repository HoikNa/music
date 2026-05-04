"use client"

import { useQuery } from "@tanstack/react-query"
import { Radio, Trophy } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { RankingRow } from "@/components/ranking/RankingRow"
import { ScoreboardTimer } from "@/components/ranking/ScoreboardTimer"
import { queryKeys } from "@/lib/queryKeys"
import { api } from "@/lib/api"
import type { WeeklyRanking, Persona } from "@/types/api"
import { useState } from "react"
import { useAuthStore } from "@/stores/auth.store"

export default function RankingsPage() {
  const { user } = useAuthStore()
  const [personaId, setPersonaId] = useState<string | undefined>(undefined)

  const { data: ranking, isLoading } = useQuery({
    queryKey: queryKeys.rankings.weekly(personaId),
    queryFn: () => api.get<WeeklyRanking>("/rankings/weekly", personaId ? { persona_id: personaId } : {}),
  })

  const { data: personasData } = useQuery({
    queryKey: queryKeys.personas.all,
    queryFn: () => api.get<{ items: Persona[] }>("/personas"),
  })

  const personas = personasData?.items ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="app-card-lift flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[var(--brand-bg)] text-[var(--brand)]">
            <Trophy className="size-5" />
          </div>
          <h1 className="text-2xl font-black">랭킹 스코어보드</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">주간 최고 점수 TOP 100</p>
        </div>
        {ranking?.period && (
          <ScoreboardTimer endAt={ranking.period.end_at} />
        )}
      </div>

      {/* Persona Tabs */}
      <Tabs value={personaId ?? "all"} onValueChange={(v) => setPersonaId(v === "all" ? undefined : v)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">종합</TabsTrigger>
          {personas.map((p) => (
            <TabsTrigger key={p.id} value={p.id}>{p.name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Ranking List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : !ranking?.period ? (
        <div className="app-card py-20 text-center text-[var(--text-muted)]">
          <Radio className="mx-auto mb-4 size-9 text-[var(--text-disabled)]" />
          <p className="font-medium">진행 중인 랭킹 기간이 없습니다</p>
          <p className="text-sm mt-1">새 라운드가 시작되면 스코어보드가 열립니다</p>
        </div>
      ) : !ranking.entries.length ? (
        <div className="app-card py-20 text-center text-[var(--text-muted)]">
          <Trophy className="mx-auto mb-4 size-9 text-[var(--text-disabled)]" />
          <p className="font-medium">아직 참가자가 없습니다</p>
          <p className="text-sm mt-1">첫 번째 도전자가 되세요!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {ranking.entries.map((entry) => (
            <RankingRow
              key={entry.submission_id}
              entry={entry}
              isMe={entry.user_id === user?.id}
            />
          ))}
        </div>
      )}

      {/* Sticky My Rank */}
      {ranking?.my_entry && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className="rounded-xl shadow-lg border border-[var(--brand)] bg-[var(--card)] overflow-hidden">
            <div className="px-3 py-1 text-xs font-bold text-center" style={{ background: "var(--brand)" }}>
              내 현재 순위
            </div>
            <RankingRow entry={ranking.my_entry} isMe />
          </div>
        </div>
      )}
    </div>
  )
}
