# 07. Security Checklist

2026-05-15 구현 기준. 체크 표기는 현재 코드/배포에서 확인된 상태를 반영한다.

---

## 전송 계층

- [x] HTTPS 강제: Vercel production, API Gateway 모두 HTTPS 사용
- [x] HSTS: `next.config.ts`에서 `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [x] 기본 보안 헤더: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- [~] CSP: 현재 `script-src 'unsafe-inline' 'unsafe-eval'` 허용. Next/Turbopack 동작을 위해 남아 있으며 hardening 필요

---

## 인증 / 세션

- [x] Access Token 60분, Refresh Token 7일 설정
- [x] Refresh Token HttpOnly Cookie 저장
- [x] Production Cookie `Secure` 적용 (`ENVIRONMENT != development`)
- [~] SameSite: 현재 `lax`. 프론트 same-origin `/api/v1` rewrite에서는 정상. 더 강한 `strict`는 OAuth/리다이렉트 UX 검토 후 적용
- [x] Refresh Token DB 저장 및 JTI claim/revoke
- [x] 로그아웃 시 refresh token revoke + cookie delete
- [x] 비밀번호 bcrypt 해시
- [~] Access Token은 메모리 + sessionStorage. 요구 보안 수준을 높이면 sessionStorage 제거 검토
- [~] 인증 rate-limit: Lambda 인스턴스 메모리 기반. 분산 rate-limit는 Redis/API Gateway/WAF 필요

---

## API 보호

- [x] CORS whitelist: `CORS_ORIGINS` 기반. Production backend 직접 호출 origin은 명시 등록 필요
- [x] Frontend production same-origin proxy: `/api/v1/*` → API Gateway rewrite로 브라우저 CORS 노출 감소
- [x] SQLModel ORM 사용. Raw SQL 없음
- [x] Upload ownership check: `audio/{user_id}/...` prefix 검증
- [x] Submission duplicate audio_url 방지
- [x] Daily submission limit 적용
- [~] Redis abuse counter: `REDIS_URL` 설정 시 user/ip/device/audio 기준 평가. 미설정 시 skip
- [ ] API Gateway/WAF 레벨 global rate-limit 정책 확정

---

## 파일 업로드

- [x] Presigned URL 발급 시 content-type allowlist 적용
- [x] Presigned URL 발급 시 50MB 크기 제한
- [x] S3 key는 `audio/{user_id}/{uuid}.{ext}` 형태
- [x] `/uploads/verify`에서 S3 HEAD로 소유권/크기/타입 검증
- [~] 매직 바이트 검사는 별도 미구현. 필요 시 validation pipeline에 추가
- [~] S3 public object URL을 반환. 운영 접근 정책/CloudFront 전환 여부 검토 필요

---

## 콘텐츠 안전 / AI

- [x] 제출 validation/moderation 서비스 레이어 분리
- [x] AI 가사 생성 전 unsafe prompt keyword blocklist 적용
- [x] OpenAI 응답 품질검사: 길이, 섹션 라벨, URL 포함 여부 등
- [x] AI compose blueprint 품질검사 + fallback
- [x] OpenAI 미설정 또는 오류 시 fallback 결과 저장, provider error는 asset에 기록
- [~] ACRCloud/저작권/AI 생성 탐지 env와 확장 포인트 존재. 운영 provider 설정 필요

---

## 프론트엔드

- [x] React JSX 기본 escaping 사용
- [x] 민감 token은 UI에 출력하지 않음
- [x] Vercel preview는 인증 보호 가능, 외부 공유는 production alias 사용
- [~] Sentry DSN/SENTRY_AUTH_TOKEN은 env로만 관리. source map 업로드 정책 별도 결정
- [ ] 브라우저 자동 E2E 검증 도구 구성

---

## 환경변수 / Secrets

- [x] `.env`, `.env.production`, `.env.local` gitignore 등록
- [x] `backend/.env.example`, `frontend/.env.example` 최신 키 반영
- [x] Production `JWT_SECRET` 기본값 사용 시 backend startup fail
- [~] 로컬 `backend/.env.production`에는 실제 운영값이 있으므로 외부 공유 금지. 가능하면 Vercel/AWS env로 이전 후 rotation 권장
- [ ] AWS Secrets Manager/SSM Parameter Store 정식 도입
- [ ] 운영 Redis URL 및 OpenAI key rotation 정책 문서화

---

## 인프라 / 운영

- [x] Frontend production 배포: `https://frontend-eta-eosin.vercel.app`
- [x] Frontend API rewrite: `/api/v1/*` same-origin proxy
- [x] Backend Lambda handler: API Gateway + custom event(scoring/feedback_tts/mastering)
- [~] IAM 최소 권한은 배포 계정에서 확인 필요
- [~] RDS network policy/VPC 접근 제한 확인 필요
- [ ] CloudWatch/Sentry alerting 기준 정의
- [ ] Admin action audit log 구현

---

## Release Gate

Production 배포 전 최소 확인:

```bash
cd backend && ./venv/bin/pytest
cd frontend && npm run lint && npm run test && npm run build
curl -I https://frontend-eta-eosin.vercel.app
curl -I https://frontend-eta-eosin.vercel.app/login
curl -i -X POST https://frontend-eta-eosin.vercel.app/api/v1/auth/register   -H 'Content-Type: application/json'   -d '{"email":"bad","password":"short","nickname":"x"}'
```

마지막 요청이 backend 422 validation을 반환하면 production rewrite가 정상이다.
