@AGENTS.md

# 프론트엔드 개발 가이드

## 명령어
```bash
npm run dev    # 개발 서버 (port 3000)
npm run build  # 빌드
npm run lint   # ESLint
```

## 라우트 구조
- `(auth)/` — 비인증 페이지 (login, register)
- `(dashboard)/` — 인증 필요 (contest, explore, rankings, submissions, credits, ai-studio 등)

## 컴포넌트 규칙
- UI 기본 컴포넌트: `shadcn/ui` 사용, 직접 구현 금지
- 커스텀 컴포넌트: `src/components/{auth|common|layout|persona|ranking|submission}/`

## 상태 관리
- 전역 상태: Zustand (`stores/auth.store.ts`, `stores/ranking.store.ts`)
- 서버 상태: TanStack Query (`hooks/` 내 커스텀 훅)

## 인증 패턴
- access_token: `sessionStorage` + axios 인터셉터
- refresh_token: HttpOnly 쿠키 (자동 갱신)
- 미들웨어(`proxy.ts`): `/admin` 라우트만 edge 보호, 일반 앱은 `AuthGate` 컴포넌트가 처리
