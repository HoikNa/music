"use client"

import { useQuery } from "@tanstack/react-query"
import { Mic2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PersonaCard } from "@/components/persona/PersonaCard"
import { queryKeys } from "@/lib/queryKeys"
import { api } from "@/lib/api"
import type { Persona } from "@/types/api"

export default function PersonasPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.personas.all,
    queryFn: () => api.get<{ items: Persona[] }>("/personas"),
  })

  return (
    <div className="space-y-6">
      <div className="app-card-lift p-6">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[var(--brand-bg)] text-[var(--brand)]">
          <Mic2 className="size-5" />
        </div>
        <h1 className="text-2xl font-black">페르소나 소개</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          각 페르소나의 취향과 채점 가중치를 확인하고 도전 전략을 세워보세요
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.items.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
        </div>
      )}
    </div>
  )
}
