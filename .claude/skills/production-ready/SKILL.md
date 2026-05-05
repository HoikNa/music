---
name: production-ready
description: 6단계 운영 준비. 데모 검증 후 운영 전환 시 호출. CI/CD, 테스트, 모니터링, 캐싱, 보안 강화. "운영 전환", "6단계", "production", "배포 준비" 시 호출.
---

# 6단계: 운영 준비 (Production Readiness)

데모/MVP에서 실제 운영 환경으로 전환. 이 단계부터 테스트, CI/CD 적극 도입.

## 체크리스트 개요
- [ ] CI/CD 구축
- [ ] 자동화 테스트
- [ ] 모니터링 강화
- [ ] 캐싱 전략
- [ ] 보안 강화
- [ ] 시크릿 관리
- [ ] 모바일 대응
- [ ] DB 백업

---

## 1. CI/CD (GitHub Actions)

### 프론트 워크플로우 (`.github/workflows/frontend.yml`)
```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy:
    needs: check
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### 백엔드 워크플로우 (`.github/workflows/backend.yml`)
```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r requirements.txt
      - run: ruff check .
      - run: mypy app/
      - run: pytest tests/ -v

  deploy:
    needs: check
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lambda 배포
        run: |
          pip install -r requirements.txt -t ./package
          cd package && zip -r ../deployment.zip . && cd ..
          zip -g deployment.zip -r app handler.py
          aws lambda update-function-code \
            --function-name ${{ secrets.LAMBDA_FUNCTION_NAME }} \
            --zip-file fileb://deployment.zip
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## 2. 자동화 테스트

### 프론트 (Vitest)
```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

우선순위 (핵심만):
- 인증 플로우 (로그인, 로그아웃)
- 핵심 비즈니스 컴포넌트
- 커스텀 훅 (useAuth, useDomain)
- Zod 스키마 검증

목표 커버리지: 50%

### 백엔드 (pytest)
```bash
pip install pytest pytest-asyncio httpx
```

우선순위:
- 인증 엔드포인트 (토큰 발급/검증)
- 핵심 CRUD 엔드포인트
- DB Helper 함수
- 권한 처리 (인가)

목표 커버리지: 50%

---

## 3. 모니터링 강화

### Sentry 상세 설정
```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% 트랜잭션 추적
  replaysOnErrorSampleRate: 1.0,  // 에러 시 재현 100%
})
```

### CloudWatch 알람 설정
```
Lambda 에러율 > 5% → 알람
Lambda 응답시간 > 3초 → 알람
RDS CPU > 80% → 알람
```

### Lambda Insights
```bash
aws lambda update-function-configuration \
  --function-name [함수명] \
  --layers arn:aws:lambda:ap-northeast-2:580247275435:layer:LambdaInsightsExtension:52
```

---

## 4. 캐싱 전략

### API Gateway 캐싱
⚠️ **주의: 인증 API에 캐싱 적용 시 타 사용자 데이터 노출 위험**

```
# 공개 API만 캐싱 허용 (사용자 무관 데이터)
/api/v1/personas        → 캐시 TTL: 1시간
/api/v1/rankings/weekly → 캐시 TTL: 5분

# 인증 API는 반드시 캐싱 비활성화 (Authorization 헤더 포함)
/api/v1/submissions     → 캐시 없음 (개인 데이터)
/api/v1/users/me        → 캐시 없음 (개인 데이터)
/api/v1/credits/*       → 캐시 없음 (개인 데이터)
```

인증 API에 캐싱이 필요한 경우 반드시 캐시 키에 `Authorization` 헤더 포함:
```
# API Gateway 캐시 키 설정 (인증 엔드포인트)
Method Request → URL Query String Parameters + Header: Authorization
```

### TanStack Query 캐싱 강화
```typescript
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5분 신선
      gcTime: 30 * 60 * 1000,       // 30분 캐시 유지
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
```

### ElastiCache Redis (선택, 대규모)
세션, 자주 조회 데이터에만 도입.

---

## 5. 보안 강화

### AWS Secrets Manager 전환
```python
# 데모: .env 파일
# 운영: AWS Secrets Manager

import boto3

def get_secret(secret_name):
    client = boto3.client("secretsmanager", region_name="ap-northeast-2")
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])

secrets = get_secret("[프로젝트명]/production")
DATABASE_URL = secrets["DATABASE_URL"]
```

### 보안 체크리스트
- [ ] HTTPS 강제 (CloudFront / Vercel 자동)
- [ ] CORS 화이트리스트 (localhost 제거)
- [ ] Rate Limiting 설정 (API Gateway)
- [ ] JWT 토큰 만료 시간 최소화
- [ ] 민감 데이터 로그 마스킹
- [ ] DB 접속 IP 화이트리스트 (RDS Security Group)
- [ ] IAM 최소 권한 원칙

---

## 6. DB 백업 설정
```bash
# RDS 자동 백업 활성화
aws rds modify-db-instance \
  --db-instance-identifier [DB명] \
  --backup-retention-period 7 \
  --preferred-backup-window "18:00-19:00"

# 포인트인타임 복구 확인
```

---

## 7. 모바일 대응

### 반응형 검증
- 375px (모바일 소형)
- 768px (태블릿)
- 1024px (데스크탑)

### PWA 설정 (선택)
```bash
npm install next-pwa
```

```javascript
// next.config.js
const withPWA = require('next-pwa')({ dest: 'public' })
module.exports = withPWA({ /* next config */ })
```

---

## 최종 운영 전환 체크리스트

### 인프라
- [ ] GitHub Actions CI/CD 파이프라인 동작
- [ ] Vercel 프로덕션 배포 확인
- [ ] Lambda 프로덕션 배포 확인
- [ ] RDS 자동 백업 활성화

### 모니터링
- [ ] Sentry 에러 수신 확인
- [ ] CloudWatch 알람 동작 확인
- [ ] Lambda Insights 데이터 수집 확인

### 보안
- [ ] HTTPS 강제 적용 확인
- [ ] CORS 프로덕션 URL만 허용
- [ ] AWS Secrets Manager 마이그레이션
- [ ] RDS Security Group IP 제한

### 테스트
- [ ] 프론트 테스트 통과 (커버리지 50%+)
- [ ] 백엔드 테스트 통과 (커버리지 50%+)
- [ ] 부하 테스트 통과 (100 동시 요청)

## 완료 시
"운영 준비 완료. 모든 체크리스트 확인 후 프로덕션 트래픽을 열어도 됩니다."
