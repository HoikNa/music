import { Progress } from "@/components/ui/progress"

const DIMENSION_LABELS: Record<string, string> = {
  pitch: "음정 정확도",
  rhythm: "리듬 안정성",
  range: "음역대 활용",
  dynamic: "다이내믹 표현",
  articulation: "발음 명료도",
}

interface ScoreBarProps {
  dimension: string
  score: number
  maxScore?: number
}

export function ScoreBar({ dimension, score, maxScore = 20 }: ScoreBarProps) {
  const pct = Math.round((score / maxScore) * 100)
  const label = DIMENSION_LABELS[dimension] ?? dimension

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-semibold tabular-nums">
          {score.toFixed(1)} <span className="text-[var(--text-disabled)] text-xs">/ {maxScore}</span>
        </span>
      </div>
      <Progress
        value={pct}
        className="h-2"
        style={{ "--progress-fill": pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--brand)" : "var(--text-muted)" } as React.CSSProperties}
      />
    </div>
  )
}
