"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Play, Plus, Radio, RefreshCw } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { RankingRow } from "@/components/ranking/RankingRow"
import { ScoreboardTimer } from "@/components/ranking/ScoreboardTimer"
import { queryKeys } from "@/lib/queryKeys"
import { api } from "@/lib/api"
import { MUSIC_GENRE_FILTERS } from "@/lib/musicGenres"
import type { WeeklyRanking, Persona } from "@/types/api"
import { useAuthStore } from "@/stores/auth.store"

export default function RankingsPage() {
  const { user } = useAuthStore()
  const [personaId, setPersonaId] = useState<string | undefined>(undefined)
  const [genre, setGenre] = useState<string | undefined>(undefined)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: ranking, isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.rankings.weekly(personaId, genre),
    queryFn: () => api.get<WeeklyRanking>("/rankings/weekly", {
      ...(personaId ? { persona_id: personaId } : {}),
      ...(genre ? { genre } : {}),
    }),
  })

  const { data: personasData } = useQuery({
    queryKey: queryKeys.personas.all,
    queryFn: () => api.get<{ items: Persona[] }>("/personas"),
  })

  const personas = personasData?.items ?? []
  const entries = ranking?.entries ?? []

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    if (selected.size === entries.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(entries.map((e) => e.submission_id)))
    }
  }

  const now = new Date()
  const dateStr = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${now.getHours() < 12 ? "오전" : "오후"} ${now.getHours() % 12 || 12}:00 기준`

  return (
    <div className="space-y-4">
      {/* Title bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-black tracking-tight">주간 차트 TOP {entries.length}</h1>
          <p className="text-[12px] text-[var(--ink-3)] mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          {ranking?.period && <ScoreboardTimer endAt={ranking.period.end_at} />}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded border border-[var(--line)] px-3 h-8 text-[12px] font-medium text-[var(--ink-1)] hover:border-[var(--ink-2)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* Persona tabs */}
      <Tabs value={personaId ?? "all"} onValueChange={(v) => setPersonaId(v === "all" ? undefined : v)}>
        <TabsList className="flex-wrap h-auto gap-1 bg-[var(--tint)] p-1">
          <TabsTrigger value="all" className="text-[13px]">종합</TabsTrigger>
          {personas.map((p) => (
            <TabsTrigger key={p.id} value={p.id} className="text-[13px]">{p.name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {MUSIC_GENRE_FILTERS.map((item) => {
          const active = (genre ?? "all") === item.code
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setGenre(item.code === "all" ? undefined : item.code)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                active
                  ? "border-[var(--green)] bg-[var(--green-bg)] text-[var(--green-d)]"
                  : "border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--green)]"
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Chart table */}
      {isLoading ? (
        <div className="space-y-0 border border-[var(--line)] rounded">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-none border-b border-[var(--line)]" />
          ))}
        </div>
      ) : !ranking?.period ? (
        <div className="py-20 text-center text-[var(--text-muted)] border border-[var(--line)] rounded">
          <Radio className="mx-auto mb-3 size-8 text-[var(--text-disabled)]" />
          <p className="font-medium text-[14px]">진행 중인 랭킹 기간이 없습니다</p>
          <p className="text-[13px] mt-1">새 라운드가 시작되면 스코어보드가 열립니다</p>
        </div>
      ) : (
        <div className="border border-[var(--line)] rounded overflow-hidden">
          {/* Table header */}
          <div className="grid items-center px-3 py-2 gap-2 bg-[var(--tint)] border-b border-[var(--line)] text-[11px] font-medium text-[var(--ink-3)] uppercase tracking-wide"
            style={{ gridTemplateColumns: "24px 40px 36px 40px 1fr 64px 56px 80px auto" }}>
            <input
              type="checkbox"
              checked={selected.size === entries.length && entries.length > 0}
              onChange={toggleAll}
              className="size-4 accent-[var(--green)] cursor-pointer"
            />
            <span className="text-center">순위</span>
            <span className="text-center">등락</span>
            <span />
            <span>곡명 / 참가자</span>
            <span className="hidden md:block">장르</span>
            <span className="text-right pr-2">점수</span>
            <span className="hidden lg:block">좋아요</span>
            <div className="flex gap-1">
              <button
                className="flex items-center gap-1 rounded border border-[var(--line)] bg-[var(--card)] px-2 h-6 text-[11px] font-medium text-[var(--ink-1)] hover:bg-[var(--tint)] transition-colors"
              >
                <Play className="size-3 fill-current" />전체듣기
              </button>
              <button
                className="flex items-center gap-1 rounded border border-[var(--line)] bg-[var(--card)] px-2 h-6 text-[11px] font-medium text-[var(--ink-1)] hover:bg-[var(--tint)] transition-colors"
              >
                <Plus className="size-3" />담기
              </button>
            </div>
          </div>

          {/* Rows */}
          {entries.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-muted)] text-[14px]">
              아직 참가자가 없습니다. 첫 번째 도전자가 되세요!
            </div>
          ) : (
            entries.map((entry) => (
              <RankingRow
                key={entry.submission_id}
                entry={entry}
                isMe={entry.user_id === user?.id}
                selected={selected.has(entry.submission_id)}
                onSelect={() => toggleSelect(entry.submission_id)}
              />
            ))
          )}
        </div>
      )}

      {/* Sticky my rank */}
      {ranking?.my_entry && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[640px] px-4">
          <div className="rounded border-2 border-[var(--green)] bg-[var(--card)] shadow-lg overflow-hidden">
            <div className="px-3 py-1 bg-[var(--green)] text-white text-[11px] font-bold text-center">
              내 현재 순위
            </div>
            <RankingRow entry={ranking.my_entry} isMe />
          </div>
        </div>
      )}
    </div>
  )
}
