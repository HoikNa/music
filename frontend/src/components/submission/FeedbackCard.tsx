import type { PersonaScore } from "@/types/api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AlertCircle, ArrowUp, CheckCircle2, Clock3, ExternalLink, Loader2, Volume2 } from "lucide-react"

interface FeedbackCardProps {
  personaScore: PersonaScore
}

export function FeedbackCard({ personaScore }: FeedbackCardProps) {
  const { persona_name, score, feedback } = personaScore
  const audioStatus = feedback?.audio_status ?? "skipped"
  const isAudioPending = audioStatus === "queued" || audioStatus === "running"
  const isAudioFailed = audioStatus === "failed"
  const isAudioReady = Boolean(feedback?.audio_url)
  const audioStatusLabel =
    audioStatus === "succeeded" ? "음성 완료"
      : audioStatus === "running" ? "음성 생성 중"
        : audioStatus === "queued" ? "음성 대기"
          : audioStatus === "failed" ? "음성 실패"
            : "음성 비활성"

  if (!feedback) {
    return (
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardContent className="p-5 text-sm text-[var(--text-muted)]">
          피드백을 준비하고 있습니다.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--card)]">
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
          <div className="text-2xl font-black tabular-nums" style={{ color: "var(--green)" }}>
            {score.toFixed(1)}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 items-center gap-1.5 rounded border border-[var(--border)] bg-[var(--secondary)] px-2.5 text-[11px] font-medium text-[var(--text-muted)]">
            {isAudioPending ? <Loader2 className="size-3 animate-spin" /> : isAudioFailed ? <AlertCircle className="size-3" /> : <Volume2 className="size-3" />}
            {audioStatusLabel}
          </span>
          {feedback.audio_model && (
            <span className="inline-flex h-7 items-center rounded border border-[var(--border)] px-2.5 font-mono text-[11px] text-[var(--text-muted)]">
              {feedback.audio_model}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--text-muted)] leading-relaxed border-l-2 pl-3"
          style={{ borderColor: "var(--brand)" }}>
          {feedback.summary}
        </p>

        {isAudioReady ? (
          <div className="rounded border border-[var(--border)] bg-[var(--secondary)] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
                <Volume2 className="size-3.5" />
                음성 피드백
              </p>
              <a
                href={feedback.audio_url!}
                target="_blank"
                rel="noreferrer"
                className="flex h-7 items-center gap-1.5 rounded border border-[var(--border)] px-2 text-[11px] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                <ExternalLink className="size-3" />
                열기
              </a>
            </div>
            <audio controls src={feedback.audio_url!} className="h-9 w-full" />
            {feedback.audio_generated_at && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <Clock3 className="size-3" />
                {new Date(feedback.audio_generated_at).toLocaleString("ko-KR")}
              </p>
            )}
          </div>
        ) : isAudioPending ? (
          <div className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--secondary)] p-3 text-xs text-[var(--text-muted)]">
            <Loader2 className="size-3.5 animate-spin" />
            음성 피드백을 생성하고 있습니다.
          </div>
        ) : isAudioFailed ? (
          <div className="flex items-start gap-2 rounded border border-[var(--border)] bg-[var(--secondary)] p-3 text-xs text-[var(--text-muted)]">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{feedback.audio_error ?? "음성 피드백 생성에 실패했습니다."}</span>
          </div>
        ) : null}

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
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--green-l)" }}>
              <ArrowUp className="size-3.5" />
              개선점
            </p>
            <ul className="space-y-1.5">
              {feedback.improvements.map((s, i) => (
                <li key={i} className="text-xs text-[var(--text-muted)] flex gap-2">
                  <span className="font-mono shrink-0 px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background: "var(--secondary)", color: "var(--green-l)" }}>
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
