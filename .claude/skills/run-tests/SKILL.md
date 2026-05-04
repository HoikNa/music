---
name: run-tests
description: 5단계 통합. 프론트/백엔드 구현 완료 후 호출. Mock → 실 API 교체, 소셜 로그인 통합, 최종 검증. "통합 시작", "5단계", "Mock 교체", "API 연결" 시 호출.
---

# 5단계: 통합 (Integration)

Mock 데이터를 실 API로 교체하고 전체 플로우를 검증한다.
데모 수준 통합이 목표. 완벽한 테스트보다 동작 확인 우선.

## 통합 순서

### 1. 환경변수 설정

`.env.local` (프론트):
```
NEXT_PUBLIC_API_URL=https://[api-gateway-id].execute-api.ap-northeast-2.amazonaws.com/prod
NEXT_PUBLIC_USE_MOCK=false
```

`.env` (백엔드):
```
DATABASE_URL=postgresql://[user]:[password]@[rds-endpoint]:5432/[dbname]
JWT_SECRET=[랜덤 256비트 시크릿]
ENVIRONMENT=production
```

### 2. Mock → 실 API 교체

프론트의 `src/lib/api.ts`에서:
```typescript
// NEXT_PUBLIC_USE_MOCK=false 설정 시 자동으로 실 API 사용
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"
```

Mock 파일은 삭제하지 말고 유지 (다음 개발 단계에서 재활용 가능).

### 3. CORS 확인
백엔드 `app/main.py`의 `allow_origins`에 Vercel 배포 URL 추가:
```python
allow_origins=[
    "https://[프로젝트명].vercel.app",
    "http://localhost:3000",  # 로컬 개발용
]
```

### 4. 소셜 로그인 통합 (선택)

#### Kakao OAuth
```
1. Kakao Developers에서 앱 생성
2. Redirect URI 등록: https://[vercel-url]/api/auth/callback/kakao
3. Client ID / Secret 환경변수 추가
4. NextAuth.js KakaoProvider 설정
```

#### Google OAuth
```
1. Google Cloud Console에서 OAuth 클라이언트 생성
2. Redirect URI: https://[vercel-url]/api/auth/callback/google
3. Client ID / Secret 환경변수 추가
4. NextAuth.js GoogleProvider 설정
```

### 5. Sentry 에러 추적 추가 (5분)

프론트:
```bash
npx @sentry/wizard@latest -i nextjs
```

백엔드:
```python
# app/main.py 상단에 추가
import sentry_sdk
sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment)
```

### 6. 플로우별 통합 검증 체크리스트

#### 인증 플로우
- [ ] 회원가입 → DB 저장 확인
- [ ] 로그인 → JWT 발급 확인
- [ ] 보호 라우트 → 미로그인 시 리다이렉트
- [ ] 로그아웃 → 토큰 삭제 확인

#### 핵심 기능 플로우
PRD의 MVP 기능별 확인:
- [ ] [기능 1] 생성 플로우
- [ ] [기능 1] 조회 플로우
- [ ] [기능 1] 수정 플로우
- [ ] [기능 1] 삭제 플로우

#### 에러 처리 플로우
- [ ] 잘못된 입력 → 에러 메시지 표시
- [ ] 네트워크 오류 → 사용자 안내
- [ ] 권한 없음 → 접근 차단

#### UI/UX 플로우
- [ ] 로딩 상태 표시 (스피너, 스켈레톤)
- [ ] 빈 상태 (Empty State) 표시
- [ ] 모바일 반응형 확인 (375px, 768px)
- [ ] Toast 알림 동작

### 7. 기획 문서와 대조
`docs/01-prd.md`의 주요 화면 목록과 실제 구현 비교:
- [ ] 모든 화면 구현됨
- [ ] API 응답 형식이 설계와 일치
- [ ] 유스케이스 시나리오대로 동작

## 데모 배포

### 프론트 (Vercel)
```bash
# Vercel CLI
npx vercel --prod

# 또는 GitHub 연동 후 자동 배포
```

### 백엔드 (AWS Lambda)
```bash
# 패키지 번들링 (매번 클린 빌드)
rm -rf package deployment.zip
pip install -r requirements.txt -t ./package
cd package && zip -r ../deployment.zip . && cd ..
zip -r deployment.zip app handler.py

# Lambda 업데이트
aws lambda update-function-code \
  --function-name [함수명] \
  --zip-file fileb://deployment.zip
```

## 완료 확인
- [ ] Vercel 배포 URL에서 프론트 정상 동작
- [ ] Lambda API 응답 정상
- [ ] Sentry 에러 수신 확인 (테스트 에러 발생)
- [ ] 모바일에서 동작 확인

## 완료 시
"통합 완료. 데모 가능한 상태입니다.
운영 전환이 필요하면 /production-ready 를 입력하세요."
