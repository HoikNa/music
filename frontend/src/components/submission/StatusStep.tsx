import type { SubmissionStatus } from "@/types/api"

const STEPS: { key: SubmissionStatus; label: string }[] = [
  { key: "pending", label: "대기중" },
  { key: "validating", label: "검증중" },
  { key: "scoring", label: "채점중" },
  { key: "scored", label: "완료" },
]

const ORDER: Record<SubmissionStatus, number> = {
  pending: 0, validating: 1, scoring: 2, scored: 3, rejected: -1,
}

export function StatusStep({ status }: { status: SubmissionStatus }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--error)" }}>
        <span className="text-base">✕</span> 반려됨
      </div>
    )
  }

  const current = ORDER[status]

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done ? "var(--success)" : active ? "var(--brand)" : "var(--secondary)",
                  color: done || active ? "white" : "var(--text-disabled)",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className="text-xs font-medium" style={{
                color: active ? "var(--brand)" : done ? "var(--success)" : "var(--text-disabled)",
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px" style={{ background: i < current ? "var(--success)" : "var(--border)" }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
