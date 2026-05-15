import {
  mockUser,
  mockPersonas,
  mockSubmissions,
  mockWeeklyRanking,
  mockCreditTransactions,
} from "./data"
import { MUSIC_GENRE_GROUPS, MUSIC_GENRES } from "@/lib/musicGenres"

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

export async function getMock(url: string, params?: Record<string, unknown>): Promise<unknown> {
  await delay()

  if (url === "/users/me") return mockUser
  if (url === "/personas") return { items: mockPersonas }
  if (url.match(/^\/personas\//)) {
    const id = url.split("/").pop()
    return mockPersonas.find((p) => p.id === id) ?? null
  }
  if (url === "/submissions") return { items: mockSubmissions, next_cursor: null, has_more: false }
  if (url === "/submissions/genres") return { groups: MUSIC_GENRE_GROUPS, items: MUSIC_GENRES }
  if (url.match(/^\/submissions\//)) {
    const id = url.split("/").pop()
    return mockSubmissions.find((s) => s.id === id) ?? null
  }
  if (url === "/rankings/weekly") {
    const genre = typeof params?.genre === "string" ? params.genre : null
    if (!genre) return mockWeeklyRanking
    return {
      ...mockWeeklyRanking,
      entries: mockWeeklyRanking.entries.filter((entry) => entry.genre === genre),
      my_entry: mockWeeklyRanking.my_entry?.genre === genre ? mockWeeklyRanking.my_entry : null,
    }
  }
  if (url === "/credits/balance") return { balance: mockUser.credit_balance }
  if (url === "/credits/transactions") return { items: mockCreditTransactions, next_cursor: null, has_more: false }
  if (url === "/auth/login" || url === "/auth/register") {
    return { access_token: "mock-token", refresh_token: "mock-refresh", token_type: "bearer" }
  }
  if (url === "/uploads/presign") {
    return { upload_url: "https://mock-s3.example.com/upload", audio_url: "https://mock-s3.example.com/audio.wav", expires_in: 300 }
  }
  if (url === "/ai/assets") {
    return {
      items: [
        {
          id: "asset-lyrics-1",
          asset_type: "lyrics",
          status: "succeeded",
          provider: "fallback",
          model: "rule-v1",
          prompt: "늦은 밤 한강을 걷는 두 사람의 담담한 고백 / Pop / Pop Ballard / warm, restrained, emotional",
          input_data: {
            theme: "늦은 밤 한강을 걷는 두 사람의 담담한 고백",
            genre: "VOVATAR_POP_BALLARD",
            mood: "warm, restrained, emotional",
          },
          output_text: "[Verse 1]\n늦은 밤 한강 위로 번진 마음\n작은 불빛 사이 너를 불러\n\n[Chorus]\n다시 너에게 닿을게\n이 노래가 끝나기 전에",
          output_url: null,
          source_submission_id: null,
          error_message: null,
          created_at: new Date().toISOString(),
        },
        {
          id: "asset-compose-1",
          asset_type: "composition",
          status: "succeeded",
          provider: "fallback",
          model: "arrangement-rule-v1",
          prompt: "늦은 밤 한강을 걷는 두 사람의 담담한 고백",
          input_data: {
            genre: "VOVATAR_POP_BALLARD",
            mood: "warm, restrained, emotional",
            duration_sec: 60,
            metadata: {
              fallback_reason: "OPENAI_API_KEY is not configured",
            },
          },
          output_text: "## 요약\n- 장르/무드: Pop / Pop Ballard / warm, restrained, emotional\n\n## 편곡 타임라인\n- 0:00-0:08: 피아노 모티프\n- 0:08-0:30: 절제된 벌스\n\n## 코드 진행\n- I - V - vi - IV\n\n## 믹스 노트\n- 보컬 중심, -14 LUFS 러프 마스터",
          output_url: null,
          source_submission_id: null,
          error_message: null,
          created_at: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
        },
        {
          id: "asset-mastering-1",
          asset_type: "mastering",
          status: "succeeded",
          provider: "ffmpeg",
          model: null,
          prompt: "target_lufs=-14",
          input_data: {
            audio_url: "https://mock-s3.example.com/audio/spring-ballad.wav",
            submission_id: null,
            target_lufs: -14,
          },
          output_text: null,
          output_url: "https://mock-s3.example.com/audio/mastered-spring-ballad.mp3",
          source_submission_id: null,
          error_message: null,
          created_at: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
        },
      ],
    }
  }
  if (url === "/ai/lyrics") {
    return {
      id: "asset-lyrics-1",
      asset_type: "lyrics",
      status: "succeeded",
      provider: "fallback",
      model: "rule-v1",
      prompt: "늦은 밤 한강을 걷는 두 사람의 담담한 고백 / Pop / Pop Ballard / warm, restrained, emotional",
      input_data: {
        theme: "늦은 밤 한강을 걷는 두 사람의 담담한 고백",
        genre: "VOVATAR_POP_BALLARD",
        mood: "warm, restrained, emotional",
      },
      output_text: "[Verse 1]\n늦은 밤 한강 위로 번진 마음\n작은 불빛 사이 너를 불러\n\n[Chorus]\n다시 너에게 닿을게\n이 노래가 끝나기 전에",
      output_url: null,
      source_submission_id: null,
      error_message: null,
      created_at: new Date().toISOString(),
    }
  }
  if (url === "/ai/compose") {
    return {
      id: "asset-compose-1",
      asset_type: "composition",
      status: "succeeded",
      provider: "fallback",
      model: "arrangement-rule-v1",
      prompt: "늦은 밤 한강을 걷는 두 사람의 담담한 고백",
      input_data: {
        genre: "VOVATAR_POP_BALLARD",
        mood: "warm, restrained, emotional",
        duration_sec: 60,
        metadata: {
          fallback_reason: "OPENAI_API_KEY is not configured",
        },
      },
      output_text: "## 요약\n- 장르/무드: Pop / Pop Ballard / warm, restrained, emotional\n\n## 편곡 타임라인\n- 0:00-0:08: 피아노 모티프\n- 0:08-0:30: 절제된 벌스\n\n## 코드 진행\n- I - V - vi - IV\n\n## 믹스 노트\n- 보컬 중심, -14 LUFS 러프 마스터",
      output_url: null,
      source_submission_id: null,
      error_message: null,
      created_at: new Date().toISOString(),
    }
  }
  if (url === "/ai/mastering") {
    return {
      id: "asset-mastering-1",
      asset_type: "mastering",
      status: "succeeded",
      provider: "ffmpeg",
      model: null,
      prompt: "target_lufs=-14",
      input_data: {
        audio_url: "https://mock-s3.example.com/audio/spring-ballad.wav",
        submission_id: null,
        target_lufs: -14,
      },
      output_text: null,
      output_url: "https://mock-s3.example.com/audio/mastered-spring-ballad.mp3",
      source_submission_id: null,
      error_message: null,
      created_at: new Date().toISOString(),
    }
  }
  if (url === "/submissions" || url.startsWith("/submissions")) {
    return { submission_id: "sub-new", status: "pending", estimated_sec: 30 }
  }

  return null
}
