import { Badge } from "@/components/ui/badge"
import { Check, Mic2 } from "lucide-react"
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
        "w-full text-left rounded-lg border p-5 transition-all",
        selected
          ? "border-[var(--brand)] bg-[var(--brand-bg)] shadow-sm"
          : "border-[var(--border)] bg-white/80 hover:border-[var(--brand-light)] hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="brand-gradient flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-sm">
          {persona.display_name.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-base">{persona.display_name}</p>
            <Badge variant="secondary" className="text-xs">{persona.genre}</Badge>
            {selected && (
              <Badge className="gap-1 text-xs" style={{ background: "var(--brand)" }}>
                <Check className="size-3" />
                선택됨
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{persona.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {persona.weights.map((w) => (
              <span key={w.dimension} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: "var(--brand-bg)", color: "var(--brand)" }}>
                <Mic2 className="size-3" />
                {DIMENSION_LABELS[w.dimension] ?? w.dimension} ×{w.multiplier}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
