"use client"

import { useQuery } from "@tanstack/react-query"
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
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">랭킹 스코어보드</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">주간 최고 점수 TOP 100</p>
        </div>
        {ranking && (
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
      ) : !ranking?.entries.length ? (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="text-4xl mb-4">🎤</p>
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
