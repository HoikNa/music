import { Badge } from "@/components/ui/badge"
import type { Persona } from "@/types/api"
import { cn } from "@/lib/utils"

const DIMENSION_LABELS: Record<string, string> = {
  pitch: "음정", rhythm: "리듬", range: "음역대", dynamic: "다이내믹", articulation: "발음",
}

interface PersonaCardProps {
  persona: Persona
  selected?: boolean
  onClick?: () => void
}

export function PersonaCard({ persona, selected = false, onClick }: PersonaCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-5 transition-all",
        selected
          ? "border-[var(--brand)] bg-[var(--brand-bg)]/10"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--brand-light)]"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shrink-0"
          style={{ background: "linear-gradient(135deg, var(--brand), var(--accent-pink))" }}>
          {persona.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-base">{persona.name}</p>
            <Badge variant="secondary" className="text-xs">{persona.genre}</Badge>
            {selected && (
              <Badge className="text-xs" style={{ background: "var(--brand)" }}>선택됨</Badge>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{persona.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {persona.weights.map((w) => (
              <span key={w.dimension} className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "var(--brand-bg)", color: "var(--brand)" }}>
                {DIMENSION_LABELS[w.dimension] ?? w.dimension} ×{w.multiplier}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
