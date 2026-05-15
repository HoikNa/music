# PRD — Vertual Owl
**AI 기반 한국어 음원 창작 & 경연 플랫폼**

| 항목 | 내용 |
|---|---|
| Document ID | PRD-VO-001 |
| Version | v0.2 |
| Date | 2026-05-15 |
| Status | Implementation Snapshot |

---

## 1. 제품 개요

Vertual Owl는 **상시형 AI 심사 경연 + 음원 창작 도구 + 유통 파이프라인**을 하나의 플랫폼으로 통합한 한국어 특화 음악 서비스다.

핵심 차별화는 두 가지다.

1. **데이터 자산**: 동일곡 다중 가창 × 5축 정량 라벨 × 페르소나 선호 × 시계열 성장 × 상업적 결과가 동시에 라벨링된 보컬 데이터셋 — 글로벌에서 유사 구조 없음.
2. **페르소나 AI**: 실제 가수(김범수, 아이유, 박효신 등)의 취향과 화법을 모델링한 AI가 점수 + 텍스트 + 음성 피드백을 제공하는 상시형 경연 구조.

---

## 2. 문제 및 기회

| 문제 | 현 대안의 한계 |
|---|---|
| 보컬 연습 피드백이 주관적·비정형 | 유튜브 강의: 일반론, 개인화 불가 / 보컬 학원: 회당 5~10만 원 |
| 아마추어 음원의 발매 경로 없음 | 플랫폼은 배포 도구만 제공, 인큐베이팅 없음 |
| 엔터사 A&R 비용 과다 | 오디션은 물리적 범위 제한, 데이터 기반 발굴 부재 |
| K-POP 특화 AI 학습 데이터 부재 | Suno/Udio: 출처 불명 데이터 + 법적 리스크 / Spotify: 최종본만 보유 |

---

## 3. 타겟 사용자

### Primary — 창작자
- **진지한 아마추어 보컬**: 10대 후반~30대, 보컬 학원 대안 탐색, 가수 데뷔 꿈
- **인디 뮤지션**: 음원 발매 및 프로모션 채널 필요, 협업자 네트워크 부재

### Secondary — B2B
- **엔터·음반사 A&R 담당자**: 신인 발굴 비용 절감, 데이터 기반 의사결정
- **광고·게임사 음악 PD**: 합법 라이선스 K-POP 음성 합성 필요

### Tertiary — 팬 / 커뮤니티
- 아티스트 성장 과정 팔로우, 스코어보드 참여, 팬덤 형성

---

## 4. 핵심 경험 (3대 UX 루프)

### 4-1. 페르소나 AI 심사
유명 가수 AI가 취향 기반 점수(Persona Score) + 가수 화법 피드백 제공.
동일 음원도 선택한 페르소나에 따라 점수가 달라짐 → 반복 도전 유도.

### 4-2. 주간 랭킹 서바이벌
오락실 스코어보드 방식. 현재 구현은 주간 랭킹 API, 장르 필터, 클라이언트 조회/새로고침 중심이다.
WebSocket 실시간 푸시와 자동 라운드 운영은 후속 단계 항목이다.

### 4-3. AI Studio 창작 보조
주제/장르/무드를 기반으로 한국어 가사와 데모 구성안을 만들고, 제출 음원 또는 URL 기반 마스터링 작업을 관리한다.
OpenAI 설정이 없거나 결과 품질검사를 통과하지 못하면 룰 기반 fallback 결과를 저장한다.

---

## 5. 기능 범위

### MVP (Phase 1 — 1~3억, 이 레포 범위)

#### 음원 제출 & 채점
- WAV/FLAC 업로드 (최대 10분)
- 1차 자동 검증: 표절(Audio Fingerprint), AI 생성 무단 활용 탐지, 저작권·욕설 필터
- 5축 기본기 채점: 음정 정확도 · 리듬 안정성 · 음역대 활용 · 다이내믹 · 발음 (각 20점)
- 페르소나 채점: 페르소나 가중치 적용 점수 산출
- 피드백: 텍스트 피드백 (200~400자) + 강점 3 / 개선점 3 (timestamp 포함)

#### 랭킹 & 경연
- 주간 랭킹 TOP 100 API
- 페르소나별 기간 데이터 모델
- 장르별 필터링 (`VOVATAR_*`, `OBD`, `AI_M` 등 공식 taxonomy)
- 마스터 스코어 챌린지와 티켓 조회 API
- 자동 마감, 실시간 WebSocket, 우승자 자동 진출권은 후속 고도화

#### 사용자 계정
- 이메일 회원가입 / 로그인
- Access Token + HttpOnly Refresh Cookie 기반 세션
- 창작자 프로필 기본 조회
- 참가 크레딧 시스템 (가입 보너스, 제출 차감, 환불/보너스/관리자 사유)

#### 어드민
- 프론트 관리자 화면 초안
- 백엔드 admin 전용 API는 현재 `/tournament/master-scores` 생성에 한정

#### AI Studio
- 가사 생성: OpenAI 또는 fallback, 안전 키워드 사전 필터
- 데모 구성안 생성: OpenAI 또는 fallback blueprint
- 마스터링: 생성 에셋 큐 생성 후 Lambda event 또는 BackgroundTasks 처리
- 생성 히스토리 조회

### Phase 2 이후 (스코프 아웃)
- 실음원 생성 provider 연동
- DAW 플러그인 (VST/AU)
- 히트 예측 AI B2B API (ENGINE 02)
- A&R Discovery AI (ENGINE 04)
- DSP 유통 연동 (지니뮤직, 멜론 등)
- KOMCA 저작권 연동 / 정산 모듈
- 음성 합성 라이선싱 (ENGINE 03)
- 한국어 보컬 파운데이션 모델 자체 개발 (ENGINE 05)

---

## 6. 시스템 아키텍처 요약

```
[Client: Web / Mobile]
        ↓
[API Gateway: JWT Auth · Rate Limit · Lambda Proxy]
        ↓
[Business Services (MSA)]
  ├── User Service          — 계정 / 역할 / 포트폴리오
  ├── Submission Service    — 음원 업로드 / 메타데이터
  ├── Scoring Service       — 5축 채점 / 표절 검증
  ├── Persona AI Engine     — 가중치 점수 / LLM 피드백
  ├── Ranking Service       — SQLModel ranking entries / genre filter
  └── Tournament Service    — 주간 마감 / 진출권 발급
        ↓
[Data Layer]
  ├── PostgreSQL            — 사용자 / 채점 / 랭킹
  ├── Redis                 — abuse counter / rate-limit 확장
  └── Object Storage        — 음원 파일 (WAV/FLAC)
```

**이 레포 기술 스택**
- Frontend: Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS v4 + Zustand + TanStack Query
- Backend: FastAPI + SQLModel + Alembic + Mangum (AWS Lambda)
- Infra: AWS Lambda + API Gateway + RDS PostgreSQL + S3 / Vercel (프론트). 프론트 production은 `/api/v1/*` same-origin rewrite로 API Gateway를 프록시한다.

---

## 7. 채점 모델 상세

### 기본기 채점 (Base Score, 50%)
| 지표 | 설명 | 알고리즘 |
|---|---|---|
| 음정 정확도 | Pitch Accuracy | DTW 기반 레퍼런스 비교 |
| 리듬 안정성 | Rhythm Stability | Beat Tracking |
| 음역대 활용 | Range Utilization | 활용 음역 측정 |
| 다이내믹 표현 | Dynamic Range | LUFS / dB 분포 |
| 발음 명료도 | Articulation | Phoneme 정렬 |

### 페르소나 채점 (Persona Score, 50%)
기본기 × 페르소나 가중치 평균

| 페르소나 | 가중 차원 | 가산 배율 |
|---|---|---|
| 김범수 | 고음 안정성 | ×1.5 |
| 아이유 | 발음 · 감정 표현 | ×1.3 |
| 박효신 | 다이내믹 · 호흡 | ×1.4 |
| 화사 | 톤 · 그루브 | ×1.3 |

---

## 8. 수익 모델

| 유형 | 모델 | 단가 |
|---|---|---|
| B2C 구독 | 보컬 AI 코치 | 월 9,900~19,900원 |
| 참가 크레딧 | 기본 무료, 추가 도전 시 | 건당 과금 |
| B2B SaaS | 히트 예측 API | 건당 50만 원 or 월 1,000만 원/사 |
| B2B 구독 | A&R Discovery | 월 500만 원 + 성공 보수 |
| 음성 라이선싱 | 보이스 클로닝 B2B | 건당 1만 원 or 매출 30% |
| 스폰서십 | 경진대회 타이틀 | 브랜드·지자체 협의 |

---

## 9. 성공 지표 (MVP KPI)

| 지표 | 목표 (출시 3개월) |
|---|---|
| 가입 창작자 수 | 10,000명 |
| 주간 음원 제출 수 | 500건/주 |
| 채점 처리 시간 | p95 < 60초 |
| 랭킹 조회 지연 | p95 < 1s |
| 크레딧 구매 전환율 | 5% |
| 주간 우승자 재참가율 | 60%+ |

---

## 10. 리스크 & 제약

| 리스크 | 대응 |
|---|---|
| 페르소나 가수 초상권 / 음성권 | 사전 라이선스 계약 필수. 현재 TTS는 피드백 오디오용 provider 기반 기능이며 실제 가수 음성 복제 아님 |
| AI 생성 콘텐츠 무단 제출 | 1차 게이트에서 AI 생성 탐지 필터 적용 |
| 표절 분쟁 | Audio Fingerprint + KOMCA DB 연동 (초기는 Chromaprint 로컬) |
| GPU 비용 | MVP는 외부 AI API 활용, Phase 3에서 자체 모델 내재화 |
| 개인정보 (가창 데이터) | 약관 동의 시 AI 학습 활용 범위 명시, 동의 철회 경로 제공 |

---

## 11. 미결 사항 (결정 필요)

- [ ] 페르소나 계약 가수 초기 라인업 확정 (MVP 1~2명부터 시작 여부)
- [ ] 참가 크레딧 초기 무료 정책 범위 (무제한 vs 주간 n회 무료)
- [ ] 운영 AI API 키 및 모델 비용 정책 확정
- [ ] 음원 스토리지 용량 제한 (사용자당 GB 한도)
- [ ] 한국 외 서비스 지역 여부 (MVP는 국내 한정?)
- [ ] Production Redis 도입 여부 및 abuse counter 정책 확정
