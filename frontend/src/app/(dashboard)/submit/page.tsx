"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, FileAudio, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { PersonaCard } from "@/components/persona/PersonaCard"
import { queryKeys } from "@/lib/queryKeys"
import { api } from "@/lib/api"
import { MUSIC_GENRE_GROUPS, musicGenreLabel } from "@/lib/musicGenres"
import type { Persona } from "@/types/api"
import { cn } from "@/lib/utils"

const STEPS = ["파일 업로드", "곡 정보", "페르소나 선택", "확인 및 제출"]

export default function SubmitPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState("")
  const [genre, setGenre] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [rankingMode, setRankingMode] = useState<"ranking" | "challenge" | "both">("both")
  const [loading, setLoading] = useState(false)
  const [durationSec, setDurationSec] = useState(0)

  const { data: personasData } = useQuery({
    queryKey: queryKeys.personas.all,
    queryFn: () => api.get<{ items: Persona[] }>("/personas"),
  })
  const personas = personasData?.items ?? []

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    if (!selected) return
    const url = URL.createObjectURL(selected)
    const audio = new Audio(url)
    audio.addEventListener("loadedmetadata", () => {
      setDurationSec(Math.round(audio.duration))
      URL.revokeObjectURL(url)
    })
  }

  function togglePersona(id: string) {
    setSelectedPersonas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length >= 3 ? prev : [...prev, id]
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
      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        const uploadRes = await fetch(presign.upload_url, {
          method: "PUT", body: file, headers: { "Content-Type": file.type },
        })
        if (!uploadRes.ok) throw new Error(`파일 업로드 실패 (${uploadRes.status})`)
      }
      const result = await api.post<{ submission_id: string }>("/submissions", {
        title, genre, audio_url: presign.audio_url,
        duration_sec: durationSec || 0,
        persona_ids: selectedPersonas, ranking_mode: rankingMode,
      })
      toast.info("채점이 시작되었습니다. 잠시 기다려주세요")
      router.push(`/submissions/${result.submission_id}`)
    } catch {
      toast.error("제출 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[640px] mx-auto space-y-5">
      {/* Page title */}
      <div>
        <h1 className="text-[20px] font-black">음원 제출</h1>
        <p className="text-[13px] text-[var(--ink-3)] mt-0.5">파일 · 곡 정보 · 페르소나를 선택하면 AI 심사가 시작됩니다</p>
      </div>

      {/* Step progress */}
      <div className="border border-[var(--line)] rounded p-4 bg-[var(--tint)]">
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <div key={n} className="flex items-center gap-2 flex-1 min-w-0">
                <div className={cn(
                  "size-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors",
                  done ? "bg-[var(--green)] text-white" : active ? "bg-[var(--green)] text-white" : "bg-[var(--card)] border border-[var(--line)] text-[var(--ink-3)]"
                )}>
                  {done ? <CheckCircle2 className="size-3.5" /> : n}
                </div>
                <span className={cn("text-[12px] truncate hidden sm:block", active ? "font-semibold text-[var(--ink-0)]" : "text-[var(--ink-3)]")}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1 mx-1 hidden sm:block", done ? "bg-[var(--green)]" : "bg-[var(--line)]")} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step 1: 파일 업로드 */}
      {step === 1 && (
        <div className="border border-dashed border-[var(--line)] rounded bg-[var(--card)] p-8 text-center space-y-4">
          <div className="mx-auto size-12 rounded-full bg-[var(--green-bg)] flex items-center justify-center">
            <FileAudio className="size-6 text-[var(--green-d)]" />
          </div>
          <div>
            <p className="text-[14px] font-semibold">WAV 또는 FLAC 파일을 선택해주세요</p>
            <p className="text-[12px] text-[var(--ink-3)] mt-1">최대 50MB · WAV / FLAC</p>
          </div>
          <input type="file" accept="audio/wav,audio/flac,.wav,.flac"
            onChange={handleFileChange} className="hidden" id="audio-file" />
          <Button type="button" variant="outline" size="sm"
            onClick={() => (document.getElementById("audio-file") as HTMLInputElement)?.click()}>
            파일 선택
          </Button>
          {file && (
            <p className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-[var(--green-d)]">
              <CheckCircle2 className="size-4" />
              {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
            </p>
          )}
          <Button onClick={() => setStep(2)} disabled={!file} className="w-full"
            style={{ background: "var(--green)" }}>
            다음 단계
          </Button>
        </div>
      )}

      {/* Step 2: 곡 정보 */}
      {step === 2 && (
        <div className="border border-[var(--line)] rounded bg-[var(--card)] divide-y divide-[var(--line)]">
          <div className="p-5 space-y-1.5">
            <label className="text-[13px] font-semibold text-[var(--ink-0)]">곡 제목 *</label>
            <Input placeholder="예: 봄날의 그대에게" value={title}
              onChange={(e) => setTitle(e.target.value)} maxLength={200}
              className="border-[var(--line)] focus:border-[var(--green)] focus:ring-[var(--green)]" />
          </div>
          <div className="p-5 space-y-2">
            <label className="text-[13px] font-semibold text-[var(--ink-0)]">장르 *</label>
            <div className="space-y-2">
              {MUSIC_GENRE_GROUPS.map((group) => {
                const options = group.children.length > 0 ? group.children : [{ code: group.code, label: group.label }]
                return (
                  <div key={group.code} className="rounded border border-[var(--line)] bg-[var(--tint)] p-2">
                    <div className="mb-1.5 text-[11px] font-bold text-[var(--ink-3)]">{group.label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {options.map((g) => (
                        <button key={g.code} type="button" onClick={() => setGenre(g.code)}
                          className={cn(
                            "rounded border px-3 py-1 text-[12px] font-medium transition-colors",
                            genre === g.code
                              ? "border-[var(--green)] bg-[var(--green-bg)] text-[var(--green-d)]"
                              : "border-[var(--line)] bg-[var(--card)] text-[var(--ink-2)] hover:border-[var(--ink-2)]"
                          )}>
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="p-5 space-y-2">
            <label className="text-[13px] font-semibold text-[var(--ink-0)]">참가 방식</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "ranking", label: "랭킹", desc: "차트 순위 경쟁" },
                { value: "challenge", label: "챌린지", desc: "마스터 점수 도전" },
                { value: "both", label: "둘 다", desc: "모두 참가" },
              ].map(({ value, label, desc }) => (
                <button key={value} type="button" onClick={() => setRankingMode(value as typeof rankingMode)}
                  className={cn(
                    "rounded border p-3 text-left transition-colors",
                    rankingMode === value
                      ? "border-[var(--green)] bg-[var(--green-bg)]"
                      : "border-[var(--line)] hover:border-[var(--ink-2)] bg-[var(--card)]"
                  )}>
                  <p className={cn("text-[13px] font-semibold", rankingMode === value ? "text-[var(--green-d)]" : "text-[var(--ink-0)]")}>
                    {label}
                  </p>
                  <p className="text-[11px] text-[var(--ink-3)] mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">이전</Button>
            <Button onClick={() => setStep(3)} disabled={!title || !genre} className="flex-1"
              style={{ background: "var(--green)" }}>
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: 페르소나 선택 */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="border border-[var(--line)] rounded bg-[var(--tint)] px-4 py-3 flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--green)]" />
            <div>
              <p className="text-[13px] font-semibold">심사할 페르소나를 선택하세요</p>
              <p className="text-[11px] text-[var(--ink-3)]">최대 3명 선택 가능 · {selectedPersonas.length}명 선택됨</p>
            </div>
          </div>
          <div className="border border-[var(--line)] rounded bg-[var(--card)] divide-y divide-[var(--line)]">
            {personas.map((p) => (
              <PersonaCard key={p.id} persona={p}
                selected={selectedPersonas.includes(p.id)}
                onClick={() => togglePersona(p.id)} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">이전</Button>
            <Button onClick={() => setStep(4)} disabled={selectedPersonas.length === 0} className="flex-1"
              style={{ background: "var(--green)" }}>
              다음 ({selectedPersonas.length}명 선택)
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: 확인 및 제출 */}
      {step === 4 && (
        <div className="space-y-3">
          <div className="border border-[var(--line)] rounded bg-[var(--card)] divide-y divide-[var(--line)]">
            <div className="px-5 py-3 flex justify-between items-center">
              <span className="text-[13px] text-[var(--ink-2)]">파일</span>
              <span className="text-[13px] font-medium">{file?.name}</span>
            </div>
            <div className="px-5 py-3 flex justify-between items-center">
              <span className="text-[13px] text-[var(--ink-2)]">곡 제목</span>
              <span className="text-[13px] font-medium">{title}</span>
            </div>
            <div className="px-5 py-3 flex justify-between items-center">
              <span className="text-[13px] text-[var(--ink-2)]">장르</span>
              <span className="text-[13px] font-medium">{musicGenreLabel(genre)}</span>
            </div>
            <div className="px-5 py-3 flex justify-between items-center">
              <span className="text-[13px] text-[var(--ink-2)]">참가 방식</span>
              <span className="text-[13px] font-medium capitalize">{rankingMode}</span>
            </div>
            <div className="px-5 py-3 flex justify-between items-center">
              <span className="text-[13px] text-[var(--ink-2)]">페르소나</span>
              <span className="text-[13px] font-medium">
                {personas.filter((p) => selectedPersonas.includes(p.id)).map((p) => p.name).join(", ")}
              </span>
            </div>
            <div className="px-5 py-3 flex justify-between items-center bg-[var(--tint)]">
              <span className="text-[13px] font-semibold text-[var(--ink-0)]">크레딧 차감</span>
              <span className="text-[14px] font-black text-[var(--error)]">-1 크레딧</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)} className="flex-1">이전</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1"
              style={{ background: "var(--green)" }}>
              {loading ? "제출 중..." : "제출하기"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
