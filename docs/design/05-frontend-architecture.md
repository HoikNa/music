# 05. Frontend Architecture

Next.js 16 App Router + React 19 기반 대시보드형 웹 앱. Vercel production에서 공개 URL은 `https://frontend-eta-eosin.vercel.app`이다.

---

## 디렉토리 구조

```text
frontend/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # AuthGate + Header
│   │   ├── admin/page.tsx          # 관리자 화면 초안
│   │   ├── ai-studio/page.tsx      # 가사/데모/마스터링/히스토리
│   │   ├── contest/page.tsx
│   │   ├── creator-studio/page.tsx
│   │   ├── credits/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── distribution/page.tsx
│   │   ├── explore/page.tsx
│   │   ├── personas/page.tsx
│   │   ├── rankings/page.tsx       # 장르 필터 포함 주간 차트
│   │   ├── submissions/page.tsx
│   │   ├── submissions/[id]/page.tsx
│   │   └── submit/page.tsx
│   ├── layout.tsx                  # Providers, font, metadata
│   ├── page.tsx                    # 공개 홈
│   └── globals.css                 # 디자인 토큰/유틸 클래스
├── components/
│   ├── auth/AuthGate.tsx
│   ├── common/Providers.tsx
│   ├── home/                       # 공개 홈 섹션
│   ├── layout/Header.tsx
│   ├── layout/HomeHeader.tsx
│   ├── persona/PersonaCard.tsx
│   ├── ranking/RankingRow.tsx
│   ├── submission/FeedbackCard.tsx
│   └── ui/                         # shadcn/base-ui 계열 primitives
├── lib/
│   ├── api.ts                      # axios client + refresh retry + API base 결정
│   ├── musicGenres.ts              # frontend 장르 taxonomy
│   ├── queryKeys.ts
│   └── mocks/
├── stores/
│   ├── auth.store.ts
│   └── ranking.store.ts
├── types/api.ts
└── proxy.ts                        # admin edge 보호 + auth page redirect
```

---

## API 클라이언트

`src/lib/api.ts`는 배포 환경에 따라 baseURL을 결정한다.

| 환경 | baseURL |
|---|---|
| 브라우저 localhost + `NEXT_PUBLIC_API_URL` 있음 | 해당 값 (`http://localhost:8000/api/v1`) |
| Vercel production/preview | `/api/v1` same-origin |
| SSR/Node | `NEXT_PUBLIC_API_URL` 또는 `http://localhost:8000/api/v1` |

배포 환경에서 `/api/v1/*`는 `next.config.ts` rewrites로 `API_PROXY_TARGET` 또는 기본 API Gateway에 전달한다.

```ts
rewrites: /api/v1/:path* -> ${API_PROXY_TARGET}/api/v1/:path*
```

Access Token은 메모리/sessionStorage에 보관하고, Refresh Token은 백엔드가 HttpOnly Cookie로 설정한다. 401 발생 시 `/auth/refresh`를 호출해 access token을 갱신하고 원 요청을 재시도한다.

---

## 인증/라우트 보호

- `/rankings`, `/explore`는 공개 접근 가능.
- 일반 대시보드 경로는 `AuthGate`가 클라이언트에서 세션 복원 후 미로그인 사용자를 `/login?redirect=...`로 보낸다.
- `/admin`은 `proxy.ts`에서 refresh cookie가 없으면 edge 단계에서 `/login`으로 보낸다. role 기반 세부 제어는 앱 화면에서 보강한다.
- 로그인/가입 성공 시 `/users/me`로 사용자 정보를 가져와 Zustand store에 저장한다.

---

## 주요 화면 상태

| 화면 | 현재 역할 |
|---|---|
| `/` | 공개 홈. 최신 제출곡/차트/경연 CTA 노출 |
| `/login`, `/register` | 이메일 인증. 소셜 버튼은 준비중 |
| `/submit` | 업로드 presign, 장르 taxonomy 선택, 페르소나 선택, 제출 |
| `/submissions/[id]` | 제출 상태 폴링, 운영 플래그, 점수, 텍스트/음성 피드백 상태 |
| `/rankings` | 주간 랭킹, 공식 장르 필터, 내 순위 표시 |
| `/ai-studio` | 가사 생성, 데모 구성안, 마스터링 요청, 생성 히스토리 |
| `/admin` | 운영 현황 초안 |

---

## Mock 전략

`NEXT_PUBLIC_USE_MOCK=true`이면 `lib/mocks/handlers.ts`를 사용한다. Mock 데이터도 공식 장르 코드와 AI assets 응답 구조를 따른다.

---

## 환경변수

`frontend/.env.example` 기준.

```text
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1   # 로컬 브라우저용
NEXT_PUBLIC_USE_MOCK=false
API_PROXY_TARGET=https://ity0jkac22.execute-api.ap-northeast-2.amazonaws.com
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

Vercel production은 `NEXT_PUBLIC_API_URL`이 없어도 `/api/v1` same-origin rewrite로 동작한다. Preview가 Vercel Authentication으로 보호될 수 있으므로 외부 공유는 production alias를 사용한다.

---

## 검증 명령

```bash
cd frontend
npm run lint
npm run test
npm run build
npx vercel deploy --prod --yes
```

배포 후 확인:

```bash
curl -I https://frontend-eta-eosin.vercel.app
curl -I https://frontend-eta-eosin.vercel.app/login
curl -i -X POST https://frontend-eta-eosin.vercel.app/api/v1/auth/register   -H 'Content-Type: application/json'   -d '{"email":"bad","password":"short","nickname":"x"}'
```

마지막 요청은 백엔드 validation 422가 반환되면 rewrite가 정상이다.
