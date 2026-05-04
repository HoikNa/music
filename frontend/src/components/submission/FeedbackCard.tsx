import type { PersonaScore } from "@/types/api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowUp, CheckCircle2 } from "lucide-react"

interface FeedbackCardProps {
  personaScore: PersonaScore
}

export function FeedbackCard({ personaScore }: FeedbackCardProps) {
  const { persona_name, score, feedback } = personaScore

  return (
    <Card className="border-[var(--border)] bg-white/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="brand-gradient flex size-10 items-center justify-center rounded-full text-sm font-black text-white">
              {persona_name.slice(0, 2)}
            </div>
            <div>
              <p className="font-bold text-sm">{persona_name}</p>
              <p className="text-xs text-[var(--text-muted)]">페르소나 심사</p>
            </div>
          </div>
          <div className="text-2xl font-black tabular-nums" style={{ color: "var(--accent)" }}>
            {score.toFixed(1)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--text-muted)] leading-relaxed border-l-2 pl-3"
          style={{ borderColor: "var(--brand)" }}>
          {feedback.summary}
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--success)" }}>
              <CheckCircle2 className="size-3.5" />
              강점
            </p>
            <ul className="space-y-1.5">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="text-xs text-[var(--text-muted)] flex gap-2">
                  <span className="font-mono shrink-0 px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background: "var(--secondary)", color: "var(--brand-light)" }}>
                    {s.timestamp}
                  </span>
                  {s.description}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--accent)" }}>
              <ArrowUp className="size-3.5" />
              개선점
            </p>
            <ul className="space-y-1.5">
              {feedback.improvements.map((s, i) => (
                <li key={i} className="text-xs text-[var(--text-muted)] flex gap-2">
                  <span className="font-mono shrink-0 px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background: "var(--secondary)", color: "var(--accent)" }}>
                    {s.timestamp}
                  </span>
                  {s.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
