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
| genre | varchar(50) | NOT NULL | 대표 장르 |
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
| genre | varchar(50) | NOT NULL | |
| lyrics | text | NULL | 가사 |
| audio_url | varchar(512) | NOT NULL | S3 경로 |
| duration_sec | int | NOT NULL | 오디오 길이(초) |
| status | enum | NOT NULL | `pending`, `validating`, `scoring`, `scored`, `rejected` |
| reject_reason | text | NULL | 반려 사유 |
| ranking_mode | enum | NOT NULL | `ranking`, `challenge`, `both` |
| credit_used | int | NOT NULL DEFAULT 0 | 차감 크레딧 |
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

AI 텍스트 피드백. 페르소나 점수당 1개.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| persona_score_id | UUID (FK→persona_scores) | NOT NULL UNIQUE | |
| summary | text | NOT NULL | 총평 (200~400자) |
| strengths | jsonb | NOT NULL | 강점 3개: [{timestamp, description}] |
| improvements | jsonb | NOT NULL | 개선점 3개: [{timestamp, description}] |
| next_challenge | jsonb | NULL | 다음 도전 추천 |
| model_version | varchar(50) | NOT NULL | LLM 버전 기록 |

---

## 9. ranking_periods

주간/월간/연간 경연 기간 단위.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| period_type | enum | NOT NULL | `weekly`, `monthly`, `yearly` |
| start_at | datetime | NOT NULL | 시작 (UTC) |
| end_at | datetime | NOT NULL | 종료 (UTC) |
| status | enum | NOT NULL | `active`, `closed` |

**인덱스**: (period_type, status), (start_at, end_at)

---

## 10. ranking_entries

랭킹 항목. 제출×기간×페르소나 조합.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| ranking_period_id | UUID (FK→ranking_periods) | NOT NULL | |
| submission_id | UUID (FK→submissions) | NOT NULL | |
| persona_id | UUID (FK→personas) | NULL | NULL = 종합 랭킹 |
| user_id | UUID (FK→users) | NOT NULL | 역정규화 (조회 최적화) |
| score | decimal(5,2) | NOT NULL | 랭킹 기준 점수 |
| rank | int | NULL | 마감 후 확정 순위 |
| previous_rank | int | NULL | 직전 주 순위 (등락 계산용) |
| genre | varchar(50) | NULL | 장르별 서브 랭킹용 |

**인덱스**: (ranking_period_id, persona_id, score DESC), (ranking_period_id, genre, score DESC)

---

## 11. tournament_tickets

주간 우승 → 월간 진출권. 월간 우승 → 연간 진출권.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| user_id | UUID (FK→users) | NOT NULL | |
| from_period_id | UUID (FK→ranking_periods) | NOT NULL | 획득한 기간 |
| to_period_type | enum | NOT NULL | `monthly`, `yearly` |
| persona_id | UUID (FK→personas) | NULL | 페르소나별 수상 시 |
| is_used | bool | DEFAULT false | |
| used_at | datetime | NULL | |

---

## 12. credits

사용자별 크레딧 잔액.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| user_id | UUID (FK→users) | NOT NULL UNIQUE | |
| balance | int | NOT NULL DEFAULT 0 | 현재 잔액 |

---

## 13. credit_transactions

크레딧 변동 이력.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID (PK) | | |
| user_id | UUID (FK→users) | NOT NULL | |
| delta | int | NOT NULL | 양수=충전, 음수=차감 |
| balance_after | int | NOT NULL | 거래 후 잔액 |
| reason | enum | NOT NULL | `signup_bonus`, `purchase`, `submission`, `reward` |
| reference_id | UUID | NULL | 관련 엔티티 ID |

**인덱스**: user_id, created_at

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
