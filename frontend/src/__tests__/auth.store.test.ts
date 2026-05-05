import { beforeEach, describe, expect, it } from "vitest"
import { useAuthStore } from "@/stores/auth.store"
import type { User } from "@/types/api"

const mockUser: User = {
  id: "user-1",
  email: "test@example.com",
  nickname: "테스터",
  role: "creator",
  profile_image_url: null,
  bio: null,
  credit_balance: 10,
  created_at: "2026-01-01T00:00:00",
}

beforeEach(() => {
  useAuthStore.setState({ user: null, isLoading: true })
  sessionStorage.clear()
})

describe("auth.store", () => {
  it("초기 상태는 user null, isLoading true", () => {
    const { user, isLoading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isLoading).toBe(true)
  })

  it("setUser: user 설정 + isLoading false", () => {
    useAuthStore.getState().setUser(mockUser)
    const { user, isLoading } = useAuthStore.getState()
    expect(user?.email).toBe("test@example.com")
    expect(isLoading).toBe(false)
  })

  it("setUser(null): user 초기화 + isLoading false", () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it("setAccessTokenAndUser: user 설정", () => {
    useAuthStore.getState().setAccessTokenAndUser("token-abc", mockUser)
    expect(useAuthStore.getState().user?.nickname).toBe("테스터")
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it("logout: user 초기화 + sessionStorage 삭제", () => {
    sessionStorage.setItem("access_token", "token-abc")
    useAuthStore.setState({ user: mockUser, isLoading: false })

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().user).toBeNull()
    expect(sessionStorage.getItem("access_token")).toBeNull()
  })
})
