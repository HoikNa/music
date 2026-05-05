---
name: implement-frontend
description: 3단계 프론트엔드 구현. 설계 완료 후 호출. Next.js 셋업, 컴포넌트 구현, Mock 전략. "프론트 시작", "3단계", "프론트엔드 구현", "Next.js 셋업" 시 호출.
---

# 3단계: 프론트엔드 구현

설계 문서 기반으로 Next.js 15 + React 19 + TypeScript 구현.
데모 우선, 동작하는 코드 우선.

## Pre-flight 체크 (셋업)

### 패키지 설치 명령
```bash
# Next.js 15 프로젝트 생성
npx create-next-app@latest [프로젝트명] \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd [프로젝트명]

# shadcn/ui 초기화
npx shadcn@latest init

# 주요 의존성
npm install zustand @tanstack/react-query @tanstack/react-query-devtools
npm install react-hook-form zod @hookform/resolvers
npm install axios

# shadcn/ui 컴포넌트 (필요한 것만)
npx shadcn@latest add button input card dialog form
npx shadcn@latest add toast badge tabs sheet
```

### 환경변수 파일
```
.env.local       ← 실제 값 (git 제외)
.env.example     ← 키만 (git 포함)
```

`.env.example` 내용:
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_WS_URL=
```

### 폴더 구조 확인
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   └── [도메인]/page.tsx
│   ├── api/ (Route Handlers)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (shadcn/ui 자동 생성, 수정 금지)
│   ├── common/ (공통 커스텀 컴포넌트)
│   └── [도메인]/ (도메인별 컴포넌트)
├── lib/
│   ├── api.ts (Axios 클라이언트)
│   ├── utils.ts
│   └── validations/ (Zod 스키마)
├── stores/ (Zustand)
├── hooks/ (커스텀 훅)
└── types/ (TypeScript 타입)
```

## Mock 전략

### Mock 파일 위치
```
src/lib/mocks/
├── [도메인].mock.ts   ← 도메인별 Mock 데이터
└── handlers.ts        ← API 응답 Mock 핸들러
```

### Mock 파일 패턴
```typescript
// src/lib/mocks/users.mock.ts
export const mockUser = {
  id: "1",
  name: "테스트 유저",
  email: "test@example.com",
}

export const mockUsers = [mockUser]
```

### API 클라이언트 (Mock 전환 가능)
```typescript
// src/lib/api.ts
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"

export const api = {
  get: async (url: string) => {
    if (USE_MOCK) return getMockData(url)
    return axios.get(url)
  }
}
```

## 구현 순서

### 1. 레이아웃 먼저
- `app/layout.tsx`: 전역 레이아웃, Provider 설정
- `components/common/Providers.tsx`: QueryClient, 인증 Provider
- 인증 레이아웃 vs 대시보드 레이아웃 분리

### 2. 공통 컴포넌트
- shadcn/ui 컴포넌트는 이미 설치됨, 추가 구현 금지
- 커스텀이 필요한 것만 `components/common/`에 추가

### 3. 페이지 순서
- 랜딩 → 로그인/회원가입 → 대시보드 (메인) → 세부 페이지

### 4. 서버 / 클라이언트 컴포넌트 원칙
```typescript
// 서버 컴포넌트 (기본, 'use client' 없음)
// - 데이터 fetch
// - SEO 필요한 페이지
// - 정적 콘텐츠

// 클라이언트 컴포넌트 ('use client' 추가)
// - 상호작용 (클릭, 폼 등)
// - 브라우저 API 사용
// - 상태 변경
```

### 5. TanStack Query 패턴
```typescript
// hooks/use-[도메인].ts
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
    staleTime: 5 * 60 * 1000, // 5분
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.patch('/users', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
```

### 6. React Hook Form + Zod 패턴
```typescript
// lib/validations/user.ts
export const userSchema = z.object({
  name: z.string().min(2, "2자 이상 입력"),
  email: z.string().email("이메일 형식"),
})

// components/[도메인]/UserForm.tsx
const form = useForm<UserFormValues>({
  resolver: zodResolver(userSchema),
})
```

### 7. Zustand 스토어 패턴
```typescript
// stores/auth.store.ts
interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
```

## Audit & Plan (구현 후 필수)
구현 완료 후 다음 검토:
1. PRD의 모든 화면이 구현됐는가?
2. 모든 유스케이스가 동작하는가?
3. 로딩 / 에러 / 빈 상태가 처리됐는가?
4. 모바일 반응형이 적용됐는가?
5. 수정이 필요한 항목을 `docs/audit-frontend.md`에 기록

## 완료 시
"프론트엔드 구현 완료. 4단계 백엔드 구현을 시작하려면 /implement-backend 를 입력하세요."
