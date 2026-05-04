"use client"

import { useQuery } from "@tanstack/react-query"
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
      <div>
        <h1 className="text-2xl font-bold">페르소나 소개</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          각 페르소나의 취향과 채점 가중치를 확인하고 도전 전략을 세워보세요
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.items.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
        </div>
      )}
    </div>
  )
}
