import type { User, Persona, Submission, WeeklyRanking, CreditTransaction } from "@/types/api"

export const mockUser: User = {
  id: "user-1",
  email: "demo@vertualowl.com",
  nickname: "음악천재",
  role: "creator",
  profile_image_url: null,
  bio: "Pop / Pop Ballard를 사랑하는 아마추어 보컬리스트",
  credit_balance: 10,
  created_at: "2026-04-01T00:00:00Z",
}

export const mockPersonas: Persona[] = [
  {
    id: "persona-1",
    name: "김범수",
    display_name: "김범수 (발라드 마스터)",
    genre: "VOVATAR_POP_BALLARD",
    image_url: null,
    description: "고음의 안정성과 감성적인 표현이 특징인 발라드의 제왕.",
    weights: [
      { dimension: "pitch", multiplier: 1.5 },
      { dimension: "dynamic", multiplier: 1.2 },
    ],
  },
  {
    id: "persona-2",
    name: "아이유",
    display_name: "아이유 (국민 아이돌)",
    genre: "VOVATAR_POP_BALLARD",
    image_url: null,
    description: "깔끔한 발음과 감성적인 표현의 완벽한 조화.",
    weights: [
      { dimension: "articulation", multiplier: 1.3 },
      { dimension: "dynamic", multiplier: 1.3 },
    ],
  },
  {
    id: "persona-3",
    name: "태양",
    display_name: "태양 (BIGBANG)",
    genre: "VOVATAR_RNB_SOUL",
    image_url: null,
    description: "리듬 그루브와 다이내믹한 에너지를 극도로 중시합니다.",
    weights: [
      { dimension: "rhythm", multiplier: 1.4 },
      { dimension: "dynamic", multiplier: 1.2 },
    ],
  },
  {
    id: "persona-4",
    name: "선미",
    display_name: "선미 (댄스팝)",
    genre: "VOVATAR_POP",
    image_url: null,
    description: "리듬 정확성과 무대 위 존재감을 최우선시하는 퍼포머.",
    weights: [
      { dimension: "rhythm", multiplier: 1.3 },
      { dimension: "articulation", multiplier: 1.2 },
    ],
  },
]

export const mockSubmissions: Submission[] = [
  {
    id: "sub-1",
    title: "봄날의 그대에게",
    genre: "VOVATAR_POP_BALLARD",
    audio_url: "https://mock-s3.example.com/audio/spring-ballad.wav",
    duration_sec: 215,
    status: "scored",
    reject_reason: null,
    ranking_mode: "both",
    is_ranking_excluded: false,
    abuse_risk_score: 0.25,
    abuse_flags: {
      status: "evaluated",
      window_sec: 3600,
      counts: { user: 1, ip: 1, device: 1, audio: 1 },
      exceeded: [],
      requires_captcha: false,
    },
    base_score: {
      pitch: 17.2, rhythm: 15.8, range: 14.5, dynamic: 16.0, articulation: 15.5, total: 79.0,
    },
    persona_scores: [
      {
        persona_id: "persona-1",
        persona_name: "김범수",
        score: 85.2,
        feedback: {
          summary: "전반적으로 안정적인 보컬 라인을 보여줬습니다. 특히 후렴구에서의 고음 처리가 인상적이었어요.",
          strengths: [
            { timestamp: "0:32", description: "후렴 진입부의 피치 안정성이 뛰어납니다" },
            { timestamp: "1:15", description: "다이내믹 변화가 자연스럽게 표현됩니다" },
            { timestamp: "2:05", description: "고음 영역에서의 음색 유지가 좋습니다" },
          ],
          improvements: [
            { timestamp: "0:18", description: "verse 초반 발음이 조금 뭉개집니다" },
            { timestamp: "1:45", description: "브릿지 부분에서 호흡이 짧아지고 있어요" },
            { timestamp: "2:30", description: "마지막 롱톤에서 비브라토를 더 안정적으로" },
          ],
          audio_url: null,
          audio_status: "running",
          audio_model: "gpt-4o-mini-tts",
          audio_error: null,
          audio_generated_at: null,
        },
      },
    ],
    created_at: "2026-04-28T14:30:00Z",
  },
  {
    id: "sub-2",
    title: "어느 봄날",
    genre: "VOVATAR_POP",
    audio_url: "https://mock-s3.example.com/audio/spring-pop.wav",
    duration_sec: 180,
    status: "scoring",
    reject_reason: null,
    ranking_mode: "ranking",
    is_ranking_excluded: true,
    abuse_risk_score: 0.85,
    abuse_flags: {
      status: "evaluated",
      window_sec: 3600,
      counts: { user: 6, ip: 8, device: 9, audio: 4 },
      exceeded: ["user", "device", "audio"],
      requires_captcha: true,
    },
    base_score: null,
    persona_scores: [],
    created_at: "2026-05-04T10:00:00Z",
  },
]

function cover(seed: string) {
  return `https://picsum.photos/seed/${seed}/80/80`
}

export const mockWeeklyRanking: WeeklyRanking = {
  period: {
    start_at: "2026-04-28T00:00:00Z",
    end_at: "2026-05-04T23:59:59Z",
    status: "active",
  },
  entries: [
    { rank: 1, user_id: "u1", nickname: "보컬킹", profile_image_url: null, submission_id: "s1", title: "사랑했잖아", score: 94.3, rank_change: 2, cover_image_url: cover("s1"), genre: "VOVATAR_POP_BALLARD", like_count: 28341 },
    { rank: 2, user_id: "u2", nickname: "노래천사", profile_image_url: null, submission_id: "s2", title: "그리움", score: 92.1, rank_change: -1, cover_image_url: cover("s2"), genre: "VOVATAR_POP", like_count: 21905 },
    { rank: 3, user_id: "u3", nickname: "멜로디st", profile_image_url: null, submission_id: "s3", title: "봄비", score: 91.5, rank_change: 0, cover_image_url: cover("s3"), genre: "VOVATAR_RNB_SOUL", like_count: 19832 },
    { rank: 4, user_id: "u4", nickname: "가을목소리", profile_image_url: null, submission_id: "s4", title: "첫눈", score: 89.7, rank_change: 3, cover_image_url: cover("s4"), genre: "VOVATAR_POP_BALLARD", like_count: 15674 },
    { rank: 5, user_id: "u5", nickname: "별빛보컬", profile_image_url: null, submission_id: "s5", title: "너를 만난 날", score: 88.2, rank_change: -2, cover_image_url: cover("s5"), genre: "VOVATAR_POP", like_count: 13421 },
    { rank: 6, user_id: "u6", nickname: "음악사랑", profile_image_url: null, submission_id: "s6", title: "잊을게", score: 87.5, rank_change: 1, cover_image_url: cover("s6"), genre: "VOVATAR_FOLK", like_count: 11293 },
    { rank: 7, user_id: "u7", nickname: "고음장인", profile_image_url: null, submission_id: "s7", title: "이별 연습", score: 86.9, rank_change: 0, cover_image_url: cover("s7"), genre: "VOVATAR_POP_BALLARD", like_count: 9847 },
    { rank: 8, user_id: "user-1", nickname: "음악천재", profile_image_url: null, submission_id: "sub-1", title: "봄날의 그대에게", score: 85.2, rank_change: 4, cover_image_url: cover("sub1"), genre: "VOVATAR_POP_BALLARD", like_count: 8203 },
    { rank: 9, user_id: "u9", nickname: "소울가수", profile_image_url: null, submission_id: "s9", title: "밤편지", score: 84.1, rank_change: -1, cover_image_url: cover("s9"), genre: "VOVATAR_RNB_SOUL", like_count: 7650 },
    { rank: 10, user_id: "u10", nickname: "달빛목소리", profile_image_url: null, submission_id: "s10", title: "그대라는 시", score: 83.7, rank_change: 2, cover_image_url: cover("s10"), genre: "VOVATAR_POP", like_count: 6934 },
    { rank: 11, user_id: "u11", nickname: "하늘보컬", profile_image_url: null, submission_id: "s11", title: "오래된 노래", score: 83.1, rank_change: 0, cover_image_url: cover("s11"), genre: "OBD", like_count: 5872 },
    { rank: 12, user_id: "u12", nickname: "리듬마스터", profile_image_url: null, submission_id: "s12", title: "춤추는 밤", score: 82.4, rank_change: -3, cover_image_url: cover("s12"), genre: "VOVATAR_EDM", like_count: 5431 },
    { rank: 13, user_id: "u13", nickname: "감성뮤직", profile_image_url: null, submission_id: "s13", title: "계절이 지나면", score: 81.8, rank_change: 1, cover_image_url: cover("s13"), genre: "VOVATAR_FOLK", like_count: 4920 },
    { rank: 14, user_id: "u14", nickname: "빛나는별", profile_image_url: null, submission_id: "s14", title: "새벽 세 시", score: 80.9, rank_change: 5, cover_image_url: cover("s14"), genre: "VOVATAR_RNB_SOUL", like_count: 4312 },
    { rank: 15, user_id: "u15", nickname: "목소리요정", profile_image_url: null, submission_id: "s15", title: "별이 빛나는 밤", score: 79.7, rank_change: 0, cover_image_url: cover("s15"), genre: "VOVATAR_POP_BALLARD", like_count: 3891 },
    { rank: 16, user_id: "u16", nickname: "재즈러버", profile_image_url: null, submission_id: "s16", title: "Blue Monday", score: 78.3, rank_change: -2, cover_image_url: cover("s16"), genre: "VOVATAR_JAZZ", like_count: 3201 },
    { rank: 17, user_id: "u17", nickname: "팝가수", profile_image_url: null, submission_id: "s17", title: "여름밤의 꿈", score: 77.6, rank_change: 0, cover_image_url: cover("s17"), genre: "VOVATAR_POP", like_count: 2987 },
    { rank: 18, user_id: "u18", nickname: "인디뮤직", profile_image_url: null, submission_id: "s18", title: "길을 걷다", score: 76.2, rank_change: 3, cover_image_url: cover("s18"), genre: "VOVATAR_FOLK", like_count: 2543 },
    { rank: 19, user_id: "u19", nickname: "록스타지망생", profile_image_url: null, submission_id: "s19", title: "폭풍 속에서", score: 75.8, rank_change: -1, cover_image_url: cover("s19"), genre: "VOVATAR_ROCK", like_count: 2108 },
    { rank: 20, user_id: "u20", nickname: "신인가수", profile_image_url: null, submission_id: "s20", title: "첫 번째 노래", score: 74.1, rank_change: 0, cover_image_url: cover("s20"), genre: "AI_M", like_count: 1834 },
  ],
  my_entry: { rank: 8, user_id: "user-1", nickname: "음악천재", profile_image_url: null, submission_id: "sub-1", title: "봄날의 그대에게", score: 85.2, rank_change: 4, cover_image_url: cover("sub1"), genre: "VOVATAR_POP_BALLARD", like_count: 8203 },
}

export const mockCreditTransactions: CreditTransaction[] = [
  { delta: 10, balance_after: 10, reason: "signup_bonus", created_at: "2026-04-01T00:00:00Z" },
  { delta: -1, balance_after: 9, reason: "submission", created_at: "2026-04-28T14:30:00Z" },
  { delta: 5, balance_after: 14, reason: "reward", created_at: "2026-04-29T10:00:00Z" },
  { delta: -1, balance_after: 13, reason: "submission", created_at: "2026-05-04T10:00:00Z" },
]
