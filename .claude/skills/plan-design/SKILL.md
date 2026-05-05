---
name: plan-design
description: 2단계 설계. PRD 완료 후 호출. DB 모델, API 명세, 디자인 시스템, 아키텍처, UX Flow 설계. "설계 시작", "2단계", "DB 설계", "API 설계" 시 호출.
---

# 2단계: 시스템 설계 (System Design)

PRD 기반으로 즉시 구현 가능한 수준의 상세 설계 문서 작성.
한국어, 코드 예제 배제, 구조 중심.

## 산출물 위치
```
docs/design/
├── 01-database-model.md
├── 02-api-spec.md
├── 03-design-system.md
├── 04-backend-architecture.md
├── 05-frontend-architecture.md
├── 06-ux-flow.md
└── 07-security-checklist.md
```

## 작성 순서 및 내용

### 1. Database Model (`01-database-model.md`)
- SQLModel 기반 테이블 정의 (컬럼명, 타입, 제약조건)
- 테이블 관계 (1:1, 1:N, N:M)
- Cascade 정책 (삭제 시 연관 데이터 처리)
- 인덱스 전략 (자주 조회하는 컬럼)
- Soft Delete 여부 (is_deleted 컬럼)
- 공통 컬럼: id, created_at, updated_at

### 2. API Spec (`02-api-spec.md`)
- Endpoint, HTTP Method, 경로
- Request: Path Param, Query Param, Body 구조
- Response: 성공/실패 Payload 구조
- 인증 필요 여부 (🔒 표시)
- 페이징 정책 (cursor / offset)
- 에러 코드 정의 (400, 401, 403, 404, 422, 500)

### 3. Design System (`03-design-system.md`)
shadcn/ui 기반으로 커스터마이징만 정의.

- **Foundation**
  - Color Palette: Primary, Secondary, Neutral, Semantic (성공/경고/오류)
  - Typography: Heading 1~4, Body, Caption, Label
  - Spacing: 기본 단위 (4px 또는 8px 기반)
  - Border Radius: sm / md / lg

- **shadcn/ui 활용 컴포넌트** (직접 구현 X)
  - Atomic: Button, Input, Badge, Checkbox, Switch
  - Compound: Card, Dialog, Sheet, Toast, Form
  - Navigation: Tabs, Dropdown, Breadcrumb

- **커스텀 컴포넌트** (shadcn/ui에 없는 것만)
  - 목록 + 설명

- **Layout 패턴**
  - 인증 레이아웃 (로그인/회원가입)
  - 대시보드 레이아웃 (사이드바 + 콘텐츠)
  - 랜딩 레이아웃 (헤더 + 섹션 + 푸터)

### 4. Backend Architecture (`04-backend-architecture.md`)
- FastAPI 라우터 구조 (도메인별 분리)
- 서비스 레이어 역할 정의
- 고수준 DB Helper 목록 (fetch_by_id, fetch_list, create, update, soft_delete)
- 의존성 주입 구조 (인증, DB 세션)
- Mangum Lambda 핸들러 래핑 방식
- 환경변수 목록 (.env.example 기반)

### 5. Frontend Architecture (`05-frontend-architecture.md`)
- Next.js App Router 폴더 구조
  ```
  app/
  ├── (auth)/login, register
  ├── (dashboard)/...
  ├── api/ (Route Handlers)
  └── globals.css
  components/
  ├── ui/ (shadcn/ui 자동 생성)
  ├── common/ (공통 커스텀)
  └── [도메인]/ (도메인별)
  lib/
  ├── api.ts (API 클라이언트)
  └── utils.ts
  stores/ (Zustand 스토어)
  hooks/ (커스텀 훅)
  ```
- 서버 컴포넌트 vs 클라이언트 컴포넌트 분리 기준
- Zustand 스토어 목록 + 상태 구조
- TanStack Query 쿼리 키 전략
- Mock 전략 (API 완성 전 사용할 mock 파일 위치)

### 6. UX Flow (`06-ux-flow.md`)
- 전체 페이지 이동 경로 다이어그램
- 주요 플로우별 상세 (로그인, 핵심 기능, 에러)
- 각 화면의 로딩 상태 / 에러 상태 / 빈 상태(Empty State) 정의
- 권한별 접근 제어 (미로그인 / 로그인 / 관리자)

### 7. Security Checklist (`07-security-checklist.md`)
- [ ] HTTPS 강제 (CloudFront / Vercel 자동)
- [ ] CORS 화이트리스트 설정
- [ ] CSRF 방어 (Next.js 서버액션 자동, API 수동)
- [ ] XSS 방어 (입력값 sanitize)
- [ ] SQL Injection 방어 (SQLModel ORM 자동)
- [ ] Rate Limiting (API Gateway 사용량 계획)
- [ ] 환경변수 코드 하드코딩 금지
- [ ] JWT 만료 시간 설정 (Access: 1시간, Refresh: 7일)
- [ ] 비밀번호 해시 (bcrypt)
- [ ] 민감 데이터 로그 출력 금지

## 설계 역검토 (필수)
모든 문서 작성 후 역순으로 검토:
1. Security → UX Flow → Frontend → Backend → API → DB 순으로 검토
2. 각 문서에서 "이 설계대로 구현할 수 있는가?" 확인
3. 누락 / 모순 발견 시 해당 문서 즉시 수정
4. 역검토 완료 후 "설계 역검토 완료" 명시

## 완료 시
"설계 완료. 3단계 프론트엔드 구현을 시작하려면 /implement-frontend 를 입력하세요."
