"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, FileAudio, ListChecks, Sparkles, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { PersonaCard } from "@/components/persona/PersonaCard"
import { queryKeys } from "@/lib/queryKeys"
import { api } from "@/lib/api"
import type { Persona } from "@/types/api"

const GENRES = ["발라드", "팝", "R&B", "힙합", "록", "트로트", "인디", "기타"]

export default function SubmitPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState("")
  const [genre, setGenre] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [rankingMode, setRankingMode] = useState<"ranking" | "challenge" | "both">("both")
  const [loading, setLoading] = useState(false)

  const { data: personasData } = useQuery({
    queryKey: queryKeys.personas.all,
    queryFn: () => api.get<{ items: Persona[] }>("/personas"),
  })
  const personas = personasData?.items ?? []

  function togglePersona(id: string) {
    setSelectedPersonas((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length >= 3
        ? prev
        : [...prev, id]
    )
  }

  async function handleSubmit() {
    if (!title || !genre || !file || selectedPersonas.length === 0) {
      toast.error("모든 항목을 입력해주세요")
      return
    }
    setLoading(true)
    try {
      const presign = await api.post<{ upload_url: string; audio_url: string }>(
        "/uploads/presign",
        { filename: file.name, content_type: file.type, file_size_bytes: file.size }
      )
      // Mock 환경에서는 S3 업로드 생략
      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        const uploadRes = await fetch(presign.upload_url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })
        if (!uploadRes.ok) {
          throw new Error(`파일 업로드 실패 (${uploadRes.status})`)
        }
      }
      const result = await api.post<{ submission_id: string }>("/submissions", {
        title,
        genre,
        audio_url: presign.audio_url,
        duration_sec: 180,
        persona_ids: selectedPersonas,
        ranking_mode: rankingMode,
      })
      toast.info("채점이 시작되었습니다. 잠시 기다려주세요")
      router.push(`/submissions/${result.submission_id}`)
    } catch {
      toast.error("제출 중 오류가 발생했습니다. 다시 시도해주세요")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="app-card-lift p-6">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[var(--brand-bg)] text-[var(--brand)]">
          <UploadCloud className="size-5" />
        </div>
        <h1 className="text-2xl font-black">음원 제출</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">파일, 곡 정보, 페르소나를 선택하면 AI 심사가 시작됩니다.</p>
      </div>

      {/* Step Indicators */}
      <div className="flex gap-2">
        {["파일 업로드", "곡 정보", "페르소나 선택", "확인 및 제출"].map((label, i) => (
          <div key={i} className="flex-1 text-center">
            <div className={`h-1 rounded-full mb-1.5 transition-colors ${step > i + 1 ? "bg-[var(--success)]" : step === i + 1 ? "bg-[var(--brand)]" : "bg-[var(--border)]"}`} />
            <p className="text-xs text-[var(--text-muted)] hidden sm:block">{label}</p>
          </div>
        ))}
      </div>

      {/* Step 1: 파일 업로드 */}
      {step === 1 && (
        <div className="app-card space-y-4 border-dashed p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--brand-bg)] text-[var(--brand)]">
            <FileAudio className="size-7" />
          </div>
          <div>
            <p className="font-semibold mb-1">WAV 또는 FLAC 파일을 선택해주세요</p>
            <p className="text-xs text-[var(--text-muted)]">최대 200MB · 최대 10분</p>
          </div>
          <input
            type="file"
            accept="audio/wav,audio/flac,.wav,.flac"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
            id="audio-file"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => (document.getElementById("audio-file") as HTMLInputElement)?.click()}
          >
            파일 선택
          </Button>
          {file && (
            <p className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--success)" }}>
              <CheckCircle2 className="size-4" />
              {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
            </p>
          )}
          <Button
            onClick={() => setStep(2)}
            disabled={!file}
            className="w-full"
            style={{ background: "var(--brand)" }}
          >
            다음
          </Button>
        </div>
      )}

      {/* Step 2: 곡 정보 */}
      {step === 2 && (
        <div className="app-card space-y-5 p-6">
          <div>
            <label className="text-sm font-medium mb-1.5 block">곡 제목 *</label>
            <Input
              placeholder="예: 봄날의 그대에게"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">장르 *</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
                  style={{
                    borderColor: genre === g ? "var(--brand)" : "var(--border)",
                    background: genre === g ? "var(--brand)" : "transparent",
                    color: genre === g ? "white" : "var(--text-muted)",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">참가 방식</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: "ranking", label: "랭킹" },
                { value: "challenge", label: "챌린지" },
                { value: "both", label: "둘 다" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRankingMode(value as "ranking" | "challenge" | "both")}
                  className="rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
                  style={{
                    borderColor: rankingMode === value ? "var(--brand)" : "var(--border)",
                    background: rankingMode === value ? "var(--brand-bg)" : "rgba(255,255,255,0.72)",
                    color: rankingMode === value ? "var(--brand)" : "var(--text-muted)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">이전</Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!title || !genre}
              className="flex-1"
              style={{ background: "var(--brand)" }}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: 페르소나 선택 */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="app-card p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-[var(--brand)]" />
              심사할 페르소나를 선택하세요
            </p>
            <p className="text-xs text-[var(--text-muted)]">최대 3명 선택 가능</p>
          </div>
          <div className="space-y-3">
            {personas.map((p) => (
              <PersonaCard
                key={p.id}
                persona={p}
                selected={selectedPersonas.includes(p.id)}
                onClick={() => togglePersona(p.id)}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">이전</Button>
            <Button
              onClick={() => setStep(4)}
              disabled={selectedPersonas.length === 0}
              className="flex-1"
              style={{ background: "var(--brand)" }}
            >
              다음 ({selectedPersonas.length}명 선택)
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: 확인 및 제출 */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="app-card space-y-3 p-6 text-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
              <ListChecks className="size-5 text-[var(--brand)]" />
              제출 내용 확인
            </h3>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">파일</span><span className="font-medium">{file?.name}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">곡 제목</span><span className="font-medium">{title}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">장르</span><span className="font-medium">{genre}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">페르소나</span>
              <span className="font-medium">{personas.filter(p => selectedPersonas.includes(p.id)).map(p => p.name).join(", ")}</span>
            </div>
            <div className="pt-2 border-t border-[var(--border)] flex justify-between">
              <span className="text-[var(--text-muted)]">크레딧 차감</span>
              <span className="font-bold" style={{ color: "var(--error)" }}>-1 크레딧</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(3)} className="flex-1">이전</Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
              style={{ background: "var(--brand)" }}
            >
              {loading ? "제출 중..." : "제출하기"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
