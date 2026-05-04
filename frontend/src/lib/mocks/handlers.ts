import {
  mockUser,
  mockPersonas,
  mockSubmissions,
  mockWeeklyRanking,
  mockCreditTransactions,
} from "./data"

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

export async function getMock(url: string): Promise<unknown> {
  await delay()

  if (url === "/users/me") return mockUser
  if (url === "/personas") return { items: mockPersonas }
  if (url.match(/^\/personas\//)) {
    const id = url.split("/").pop()
    return mockPersonas.find((p) => p.id === id) ?? null
  }
  if (url === "/submissions") return { items: mockSubmissions, next_cursor: null, has_more: false }
  if (url.match(/^\/submissions\//)) {
    const id = url.split("/").pop()
    return mockSubmissions.find((s) => s.id === id) ?? null
  }
  if (url === "/rankings/weekly") return mockWeeklyRanking
  if (url === "/credits/balance") return { balance: mockUser.credit_balance }
  if (url === "/credits/transactions") return { items: mockCreditTransactions, next_cursor: null, has_more: false }
  if (url === "/auth/login" || url === "/auth/register") {
    return { access_token: "mock-token", refresh_token: "mock-refresh", token_type: "bearer" }
  }
  if (url === "/uploads/presign") {
    return { upload_url: "https://mock-s3.example.com/upload", audio_url: "https://mock-s3.example.com/audio.wav", expires_in: 300 }
  }
  if (url === "/submissions" || url.startsWith("/submissions")) {
    return { submission_id: "sub-new", status: "pending", estimated_sec: 30 }
  }

  return null
}
