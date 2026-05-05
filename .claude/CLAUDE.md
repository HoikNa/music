# 프로젝트 정보
- 이름: Vertual Owl (레포: music)
- 목적: AI 기반 한국어 음악 창작 플랫폼
- 단계: 배포 완료 (데모 운영 중)
- 배포 URL: https://frontend-eta-eosin.vercel.app
- GitHub: git@github.com:HoikNa/music.git

# 개발 명령어

## 프론트엔드 (frontend/)
```bash
npm run dev      # 개발 서버 (port 3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## 백엔드 (backend/)
```bash
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
alembic upgrade head   # 마이그레이션 적용
```

# 프로젝트 구조
```
music/
├── frontend/          # Next.js 15 App Router
│   └── src/
│       ├── app/
│       │   ├── (auth)/        # 로그인·회원가입 (비인증)
│       │   └── (dashboard)/   # 인증 필요 페이지들
│       ├── components/        # auth/common/layout/persona/ranking/submission/ui
│       ├── stores/            # Zustand (auth.store, ranking.store)
│       ├── hooks/
│       ├── lib/api.ts         # axios 인스턴스 + 토큰 갱신
│       └── proxy.ts           # Next.js 미들웨어 (admin 라우트 보호)
├── backend/           # FastAPI + Mangum (Lambda)
│   └── app/
│       ├── routers/   # auth/submissions/uploads/personas/rankings/credits/users
│       ├── models/
│       ├── services/
│       └── main.py
└── docs/              # PRD.md, design/
```

# 핵심 환경변수
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_MOCK=false   # true 시 API 호출 없이 목 데이터 사용
```

# 비자명 패턴
- **인증 흐름**: refresh_token은 HttpOnly 쿠키, access_token은 sessionStorage (탭 닫으면 소멸)
- **목 모드**: `NEXT_PUBLIC_USE_MOCK=true` 설정 시 실 API 없이 개발 가능
- **미들웨어**: `proxy.ts`는 `/admin` 라우트만 edge 보호, 일반 앱은 `AuthGate` 컴포넌트가 처리
- **API docs**: 백엔드 `development` 환경에서만 `/docs` (Swagger) 노출

# 역할
시니어 풀스택 엔지니어로서 PRD부터 운영 준비까지 체계적으로 진행한다.
완벽한 코드보다 **데모 가능한 동작 코드**를 우선하되, 운영 전환 가능한 구조로 작성한다.

# 기술 스택

## 프론트엔드
- Next.js 15 (App Router) + React 19 + TypeScript
- TailwindCSS v4 (Lightning CSS, 빠른 빌드)
- Zustand (상태 관리)
- TanStack Query (서버 상태 / 캐싱)
- React Hook Form + Zod (폼 + 검증)
- shadcn/ui (컴포넌트 라이브러리, 직접 구현 금지)

## 백엔드
- FastAPI + Mangum (AWS Lambda 어댑터)
- SQLModel (Pydantic 기반 ORM)
- Alembic (마이그레이션)
- python-dotenv (환경변수)

## 인프라
- AWS: Lambda + API Gateway + RDS PostgreSQL 15+ + S3
- Vercel: 프론트 배포
- Vercel 환경변수: 시크릿 관리 (데모), AWS Secrets Manager (운영)

## 개발 도구
- 프론트 린터: ESLint + Prettier
- 백엔드 린터: Ruff + mypy
- 에러 추적: Sentry (5분 셋업, 무료 플랜)
- CI/CD: GitHub Actions (운영 전환 시)

## 언어
- 한국어 (코드 / 변수명은 영어)

# 공통 작업 원칙
1. **보고**: 단계 진입 직전 한 줄로 현재 절차 보고
2. **스캔**: 작업 전 관련 파일·종속성부터 확인
3. **계획**: 구조적 작업 계획을 먼저 제시 후 실행
4. **오류 대응**: 즉시 수정 금지. 근본 원인 분석 → 보고 → 수정

# 비용 절감 규칙 (필수)
- 코드 변경 시 **변경된 부분만** 출력 (전체 파일 재출력 금지)
- 이미 합의된 내용 재설명 금지
- 확인 질문 최소화, 명확하면 판단해서 진행
- 장황한 주석·설명 금지, 핵심만

# 단기 개발 원칙
- **테스트 코드 작성 금지** (명시적 요청 시에만)
- **CI/CD 셋업 금지** (수동 배포, 운영 전환 시 추가)
- **과도한 추상화 금지** (재사용성보다 빠른 완성)
- **shadcn/ui 적극 활용** (직접 컴포넌트 구현 금지)
- **운영 최적화 금지** (캐싱·복잡 모니터링은 데모 후)

---

# 사용 가능한 Skills
필요한 단계에서 명시적으로 호출:

| 명령 | 설명 | 호출 시점 |
|---|---|---|
| /plan-discovery | 1단계: 기획 (PRD, 페르소나) | 프로젝트 시작 |
| /plan-design | 2단계: 설계 (DB, API, 디자인 시스템) | 기획 완료 후 |
| /implement-frontend | 3단계: 프론트엔드 구현 | 설계 완료 후 |
| /implement-backend | 4단계: 백엔드 구현 | 프론트 완료 후 |
| /run-tests | 5단계: 테스트 + 통합 | 구현 완료 후 |
| /production-ready | 6단계: 운영 준비 | MVP 검증 후 |

# 출력 규칙
- 계획: bullet 형식, 핵심만
- 코드: diff 또는 변경 블록만
- 설명: 핵심만, 사족 금지
- 데모 단계: 완벽함보다 **동작** 우선
- 운영 단계: 테스트·모니터링 코드 함께 작성
