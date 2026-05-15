# 01. Database Model

SQLModel 기반. 공통 컬럼(id, created_at, updated_at)은 모든 테이블에 포함.
Soft Delete는 `is_deleted: bool = False` + `deleted_at: datetime | None` 로 구현. 명시 표시.

---

## 공통 컬럼 (Base Model)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID (PK) | 자동 생성 |
| created_at | datetime | 생성 시각 (UTC) |
| updated_at | datetime | 최종 수정 시각 (UTC) |

---

## 1. users

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| email | varchar(255) | UNIQUE NOT NULL | 로그인 식별자 |
| hashed_password | varchar(255) | NULL | 소셜 로그인 시 NULL |
| nickname | varchar(50) | UNIQUE NOT NULL | 표시 이름 |
| role | enum | NOT NULL | `creator`, `fan`, `admin` |
| provider | enum | NOT NULL | `email`, `kakao`, `google` |
| provider_id | varchar(255) | NULL | OAuth 제공자 UID |
| profile_image_url | varchar(512) | NULL | |
| bio | text | NULL | |
| is_deleted | bool | DEFAULT false | Soft Delete |
| deleted_at | datetime | NULL | |

**인덱스**: email, nickname, (provider, provider_id)

---

## 2. personas

가수 페르소나 마스터 데이터.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| name | varchar(50) | UNIQUE NOT NULL | 예: "김범수" |
| display_name | varchar(100) | NOT NULL | 표시명 |
| genre | varchar(50) | NOT NULL | 공식 장르 코드. 예: `VOVATAR_POP_BALLARD` |
| image_url | varchar(512) | NULL | 프로필 이미지 |
| description | text | NULL | 소개 |
| is_active | bool | DEFAULT true | 활성 여부 |
| sort_order | int | DEFAULT 0 | 노출 순서 |

---

## 3. persona_weights

페르소나별 5축 가중치 정의. 하나의 페르소나가 복수의 가중치 항목 보유.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| persona_id | UUID (FK→personas) | NOT NULL | |
| dimension | enum | NOT NULL | `pitch`, `rhythm`, `range`, `dynamic`, `articulation` |
| multiplier | decimal(4,2) | NOT NULL | 가중 배율 (예: 1.5) |
| bonus_threshold | decimal(5,2) | NULL | 가산점 발동 최소 점수 |

**인덱스**: (persona_id, dimension)

---

## 4. submissions

음원 제출 단위. 한 제출이 여러 페르소나를 선택 가능 → `submission_personas` 연결.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| user_id | UUID (FK→users) | NOT NULL | |
| title | varchar(200) | NOT NULL | 곡 제목 |
| genre | varchar(50) | NOT NULL | 공식 장르 코드. `docs/design/08-music-genre-taxonomy.md` 기준 |
| lyrics | text | NULL | 가사 |
| audio_url | varchar(512) | NOT NULL | S3 경로 |
| duration_sec | int | NOT NULL | 오디오 길이(초) |
| status | enum | NOT NULL | `pending`, `validating`, `scoring`, `scored`, `rejected` |
| reject_reason | text | NULL | 반려 사유 |
| ranking_mode | enum | NOT NULL | `ranking`, `challenge`, `both` |
| credit_used | int | NOT NULL DEFAULT 0 | 차감 크레딧 |
| is_ranking_excluded | bool | DEFAULT false | abuse/rate-limit 정책으로 랭킹 제외 여부 |
| abuse_risk_score | float | DEFAULT 0.0 | 제출 abuse 위험도(0~1) |
| abuse_flags | json | NULL | Redis counter 평가 결과 및 skip 사유 |
| is_deleted | bool | DEFAULT false | |
| deleted_at | datetime | NULL | |

**인덱스**: user_id, status, created_at

---

## 5. submission_personas

N:M — 제출 ↔ 페르소나.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| submission_id | UUID (FK→submissions) | NOT NULL | |
| persona_id | UUID (FK→personas) | NOT NULL | |

**인덱스**: (submission_id, persona_id) UNIQUE

---

## 6. base_scores

5축 기본기 채점 결과. 제출당 1개.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| submission_id | UUID (FK→submissions) | NOT NULL UNIQUE | |
| pitch_score | decimal(5,2) | NOT NULL | 음정 정확도 (0~20) |
| rhythm_score | decimal(5,2) | NOT NULL | 리듬 안정성 (0~20) |
| range_score | decimal(5,2) | NOT NULL | 음역대 활용 (0~20) |
| dynamic_score | decimal(5,2) | NOT NULL | 다이내믹 표현 (0~20) |
| articulation_score | decimal(5,2) | NOT NULL | 발음 명료도 (0~20) |
| total_score | decimal(5,2) | NOT NULL | 합산 (0~100) |
| processing_sec | int | NULL | 처리 시간(초) |

---

## 7. persona_scores

페르소나별 가중 점수. 제출×페르소나 조합당 1개.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| submission_id | UUID (FK→submissions) | NOT NULL | |
| persona_id | UUID (FK→personas) | NOT NULL | |
| base_score_id | UUID (FK→base_scores) | NOT NULL | |
| persona_score | decimal(5,2) | NOT NULL | 페르소나 가중 점수 (0~100) |
| weighted_breakdown | jsonb | NULL | 차원별 가중 점수 상세 |

**인덱스**: (submission_id, persona_id) UNIQUE

---

## 8. feedbacks

AI 텍스트/음성 피드백. 페르소나 점수당 1개.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| persona_score_id | UUID (FK→persona_scores) | NOT NULL UNIQUE | |
| summary | text | NOT NULL | 총평 (200~400자) |
| strengths | jsonb | NOT NULL | 강점 3개: [{timestamp, description}] |
| improvements | jsonb | NOT NULL | 개선점 3개: [{timestamp, description}] |
| next_challenge | jsonb | NULL | 다음 도전 추천 |
| model_version | varchar(50) | NOT NULL | LLM 버전 기록 |
| audio_url | varchar(512) | NULL | TTS 피드백 오디오 URL |
| audio_status | varchar(20) | NOT NULL DEFAULT queued | `queued`, `running`, `succeeded`, `failed`, `skipped` |
| audio_model | varchar(50) | NULL | TTS 모델명 |
| audio_error | varchar(500) | NULL | TTS 실패 사유 |
| audio_generated_at | datetime | NULL | TTS 생성 완료 시각 |

---

## 9. ranking_periods

주간/월간 경연 기간 단위. 현재 모델은 페르소나별 기간을 가진다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| persona_id | UUID (FK→personas) | NOT NULL | 기간 소유 페르소나 |
| period_type | enum | NOT NULL | `weekly`, `monthly` |
| start_date | date | NOT NULL | 시작일 |
| end_date | date | NOT NULL | 종료일 |
| status | enum | NOT NULL | `active`, `closed`, `archived` |

**인덱스**: persona_id, status

---

## 10. ranking_entries

랭킹 항목. 제출×기간 조합. 장르 필터와 라벨은 `submissions` join으로 산출한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| period_id | UUID (FK→ranking_periods) | NOT NULL | |
| submission_id | UUID (FK→submissions) | NOT NULL | |
| user_id | UUID (FK→users) | NOT NULL | 역정규화 (조회 최적화) |
| rank | int | NOT NULL | 현재/확정 순위 |
| previous_rank | int | NULL | 직전 주 순위 (등락 계산용) |
| persona_score | float | NOT NULL DEFAULT 0 | 랭킹 기준 점수 |
| vote_count | int | NOT NULL DEFAULT 0 | 투표/집계 확장용 |
| is_survived | bool | DEFAULT false | 서바이벌 통과 여부 |

**인덱스**: period_id, submission_id, user_id

---

## 11. master_scores

가수를 이겨라/마스터 챌린지의 목표 점수.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| persona_id | UUID (FK→personas) | NOT NULL | 대상 페르소나 |
| target_score | float | NOT NULL | 격파 기준 점수 |
| is_active | bool | DEFAULT true | 현재 활성 여부 |
| valid_from | datetime | NOT NULL | 시작 시각 |
| valid_until | datetime | NULL | 종료 시각 |
| created_by | UUID (FK→users) | NOT NULL | 생성 admin |

---

## 12. tournament_tickets

마스터 스코어 격파 등으로 발급되는 티켓.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| user_id | UUID (FK→users) | NOT NULL | |
| persona_id | UUID (FK→personas) | NOT NULL | |
| submission_id | UUID (FK→submissions) | NOT NULL | 티켓 획득 제출 |
| master_score_id | UUID (FK→master_scores) | NULL | 기준 마스터 스코어 |
| status | enum | NOT NULL | `unused`, `used`, `expired` |
| expires_at | datetime | NOT NULL | 만료 시각 |
| used_at | datetime | NULL | 사용 시각 |

---

## 13. credits

사용자별 크레딧 잔액.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| user_id | UUID (FK→users) | NOT NULL UNIQUE | |
| balance | int | NOT NULL DEFAULT 0 | 현재 잔액 |

---

## 14. credit_transactions

크레딧 변동 이력.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| user_id | UUID (FK→users) | NOT NULL | |
| amount | int | NOT NULL | 양수=충전/보너스, 음수=차감 |
| reason | enum | NOT NULL | `signup_bonus`, `purchase`, `submission`, `reward`, `refund`, `bonus`, `admin` |
| submission_id | UUID (FK→submissions) | NULL | 관련 제출 |
| note | varchar(255) | NULL | 운영 메모 |

**인덱스**: user_id, created_at

---

## 15. generated_assets

AI Studio에서 생성한 가사, 데모 구성안, 마스터링 결과.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| user_id | UUID (FK→users) | NOT NULL | 생성 사용자 |
| asset_type | enum | NOT NULL | `lyrics`, `composition`, `mastering` |
| status | enum | NOT NULL | `queued`, `running`, `succeeded`, `failed`, `skipped` |
| provider | varchar(50) | NOT NULL | `openai`, `fallback`, `ffmpeg` 등 |
| model | varchar(100) | NULL | 모델명 |
| prompt | text | NULL | 사용자 입력/요약 prompt |
| input_data | json | NULL | 원본 요청 body 및 metadata |
| output_text | text | NULL | 가사 또는 데모 구성안 |
| output_url | varchar(512) | NULL | 생성/마스터링된 오디오 URL |
| source_submission_id | UUID (FK→submissions) | NULL | 마스터링 원본 제출 |
| error_message | text | NULL | 실패/Provider 오류 메시지 |

**인덱스**: user_id, asset_type, status

---

## 테이블 관계 요약

```
users ──────────────────────── credits (1:1)
  │                             credit_transactions (1:N)
  │                             submissions (1:N)
  │                             ranking_entries (1:N, 역정규화)
  │                             tournament_tickets (1:N)
  │
submissions ─── submission_personas (N:M) ─── personas
       │                                         │
       ├── base_scores (1:1)                     └── persona_weights (1:N)
       │
       └── persona_scores (1:N, per persona) ─── feedbacks (1:1)
             │
             └── ranking_entries (via score)

users ─── generated_assets (1:N)
submissions ─── generated_assets (1:N, optional source_submission_id)
```

---

## Cascade 정책

| 부모 삭제 | 자식 처리 |
|---|---|
| users | submissions: Soft Delete 연쇄 / credits: 유지 |
| submissions | base_scores, persona_scores, feedbacks: Cascade Delete |
| personas | persona_weights: Cascade Delete / persona_scores: SET NULL 금지 (비활성화 처리) |
| ranking_periods | ranking_entries: Cascade Delete (기간 삭제 시) |

---

## 마이그레이션 전략

- Alembic autogenerate 기반
- 테이블 생성 순서: users → personas → persona_weights → credits → submissions → submission_personas → base_scores → persona_scores → feedbacks → ranking_periods → ranking_entries → tournament_tickets → credit_transactions
