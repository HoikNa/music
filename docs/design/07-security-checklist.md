# 07. Security Checklist

MVP 단계 기준. 각 항목은 구현 완료 시 체크.

---

## 전송 계층

- [ ] **HTTPS 강제** — Vercel(프론트), API Gateway(백엔드) 자동 적용. HTTP → HTTPS 리디렉션 확인
- [ ] **HSTS** — `Strict-Transport-Security: max-age=31536000` 헤더 (Vercel 기본 설정 확인)

---

## 인증 / 세션

- [ ] **JWT 만료 시간 설정** — Access Token 60분, Refresh Token 7일
- [ ] **Refresh Token HttpOnly Cookie 저장** — `Secure; SameSite=Strict` 속성 필수
- [ ] **Access Token 메모리 저장** — localStorage/sessionStorage 금지
- [ ] **Refresh Token 블랙리스트** — 로그아웃 시 서버 측 무효화 (Redis TTL 활용)
- [ ] **비밀번호 해시** — bcrypt, cost factor 12 이상
- [ ] **브루트포스 방지** — 로그인 실패 5회 → 15분 잠금 (Redis 카운터)

---

## API 보호

- [ ] **CORS 화이트리스트** — `CORS_ORIGINS` 환경변수. `*` 금지
- [ ] **Rate Limiting** — API Gateway 레벨: 전체 1000 req/min, 인증 엔드포인트 10 req/min
- [ ] **Input 크기 제한** — FastAPI `max_body_size` 설정 (음원 제외 JSON: 1MB)
- [ ] **SQL Injection 방어** — SQLModel ORM 파라미터 바인딩 자동 처리. Raw SQL 금지
- [ ] **Path Traversal 방지** — 파일 경로 파라미터 화이트리스트 검증

---

## 프론트엔드

- [ ] **XSS 방어** — React JSX 자동 이스케이프. `dangerouslySetInnerHTML` 사용 금지
- [ ] **CSRF 방어** — Next.js Server Actions 자동 처리. API 직접 호출 시 `SameSite=Strict` Cookie 의존
- [ ] **Content Security Policy** — `next.config.js`에서 CSP 헤더 정의 (인라인 스크립트 제한)
- [ ] **민감 정보 로그 출력 금지** — 비밀번호, 토큰, 개인정보 `console.log` 제거

---

## 파일 업로드

- [ ] **파일 타입 검증** — Content-Type + 매직 바이트 모두 검사 (`audio/wav`, `audio/flac`만 허용)
- [ ] **파일 크기 제한** — 200MB. Presigned URL 생성 시 서버 측 검증 포함
- [ ] **S3 버킷 퍼블릭 접근 차단** — 버킷 자체는 Private. CloudFront or Presigned URL로만 제공
- [ ] **파일명 무작위화** — 원본 파일명 사용 금지. UUID + 확장자로 저장

---

## 데이터 보호

- [ ] **환경변수 코드 하드코딩 금지** — `settings.py` (pydantic-settings) 경유만 허용. `.env` 파일 `.gitignore` 등록
- [ ] **민감 데이터 마스킹** — 에러 응답에 DB 스키마, 스택 트레이스 노출 금지 (prod 환경)
- [ ] **개인정보 최소 수집** — 서비스에 불필요한 필드 수집 금지
- [ ] **음원 데이터 AI 학습 동의** — 제출 약관에 AI 학습 활용 범위 명시 + 동의 체크박스 분리

---

## 인프라

- [ ] **IAM 최소 권한** — Lambda 실행 역할은 S3(특정 버킷), RDS, CloudWatch 권한만 부여
- [ ] **DB 접근 제한** — RDS는 Lambda VPC 내부에서만 접근. 퍼블릭 엔드포인트 비활성화
- [ ] **Secrets 관리** — 환경변수는 Vercel Dashboard / AWS Systems Manager Parameter Store에 저장. 코드 외부
- [ ] **감사 로그** — 어드민 작업(상태 변경, 페르소나 수정)은 별도 로그 기록

---

## 콘텐츠 안전

- [ ] **표절 검증** — 제출 1차 게이트에서 Audio Fingerprint 검사
- [ ] **AI 생성 콘텐츠 탐지** — MVP에서는 서명 기반 탐지 적용 (정확도 낮음 — 추후 개선)
- [ ] **저작권 침해 필터** — 등록된 저작권 음원 DB 대조 (초기: Chromaprint 로컬 DB)
- [ ] **부적절 가사 필터** — 욕설/혐오 키워드 필터 (한국어 기준)

---

## 미결 / Phase 2 이후

- 음성 데이터 비식별화 (대규모 학습 데이터 활용 시)
- GDPR/개인정보보호법 준거 검토 (해외 서비스 확장 시)
- AWS WAF 도입 (DDoS 대응)
- 침투 테스트 (운영 전환 전)
