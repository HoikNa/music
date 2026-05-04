# 03. Design System

shadcn/ui 기반. 커스터마이징 정의만 기술 — 직접 컴포넌트 구현 금지.
브랜드 컨셉: 다크 프리미엄 음악 플랫폼. 바이올렛+선셋 그라디언트 포인트.

---

## Foundation

### Color Palette

TailwindCSS CSS Variables 방식 (`globals.css`에서 정의).

**Brand**
| Token | Hex | 용도 |
|---|---|---|
| `--color-brand` | #7C5CFF | Primary CTA, 링크, 활성 상태 |
| `--color-brand-light` | #9580FF | Hover 상태 |
| `--color-brand-bg` | #EFE9FF | 배지 배경, 강조 배경 |
| `--color-accent` | #FFB547 | 상금/보상/하이라이트 |
| `--color-accent-pink` | #FF7EC8 | 보조 포인트 (2차 CTA) |

**Background (다크 테마 기본)**
| Token | Hex | 용도 |
|---|---|---|
| `--color-bg` | #0F0B2C | 최하위 배경 |
| `--color-bg-card` | #1A1535 | 카드 배경 |
| `--color-bg-elevated` | #241E45 | 모달, 드롭다운 |
| `--color-bg-subtle` | #2E2758 | 인풋 배경 |

**Text**
| Token | Hex | 용도 |
|---|---|---|
| `--color-text` | #F5F3FF | 기본 텍스트 |
| `--color-text-muted` | #A09BC0 | 보조 텍스트, 플레이스홀더 |
| `--color-text-disabled` | #5A5480 | 비활성 |

**Border**
| Token | Hex | 용도 |
|---|---|---|
| `--color-border` | #3D3660 | 기본 테두리 |
| `--color-border-subtle` | #2A244E | 구분선 |

**Semantic**
| Token | Hex | 용도 |
|---|---|---|
| `--color-success` | #3DD9A4 | 성공, 완료 |
| `--color-warning` | #FFB547 | 경고 |
| `--color-error` | #FF6B6B | 오류 |
| `--color-info` | #5BB8FF | 정보 |

---

### Typography

기본 폰트: `Pretendard` (한국어) → fallback: `-apple-system, BlinkMacSystemFont, sans-serif`
코드 폰트: `JetBrains Mono`

| 역할 | 클래스 | 크기 | 굵기 | Line-height |
|---|---|---|---|---|
| Heading 1 | `text-h1` | 36px | 800 | 1.15 |
| Heading 2 | `text-h2` | 28px | 700 | 1.2 |
| Heading 3 | `text-h3` | 22px | 700 | 1.3 |
| Heading 4 | `text-h4` | 18px | 600 | 1.4 |
| Body Large | `text-body-lg` | 16px | 400 | 1.7 |
| Body | `text-body` | 14px | 400 | 1.6 |
| Caption | `text-caption` | 12px | 400 | 1.5 |
| Label | `text-label` | 11px | 700 | 1.4 (letter-spacing 0.08em) |

---

### Spacing

4px 기반. Tailwind 기본 스케일 사용 (`p-1`=4px, `p-2`=8px, ...).

컴포넌트 내부 패딩 기준:
- 버튼 sm: `px-3 py-1.5`
- 버튼 md: `px-4 py-2`
- 버튼 lg: `px-6 py-3`
- 카드: `p-5` (20px)
- 모달: `p-6` (24px)

---

### Border Radius

| 토큰 | 값 | 적용 |
|---|---|---|
| `rounded-sm` | 6px | 배지, 태그 |
| `rounded-md` | 10px | 버튼, 인풋 |
| `rounded-lg` | 16px | 카드 |
| `rounded-xl` | 24px | 모달, 바텀시트 |
| `rounded-full` | 9999px | 아바타, 원형 버튼 |

---

## shadcn/ui 활용 컴포넌트

직접 구현 금지. `npx shadcn@latest add [컴포넌트]` 로 설치 후 CSS 변수만 커스터마이징.

### Atomic
- `Button` — variant: default, outline, ghost, destructive + 커스텀 `brand`
- `Input` — 텍스트, 검색, 파일 업로드
- `Badge` — variant: default, secondary, outline + 커스텀 `score`, `rank`
- `Checkbox`, `Switch`, `Slider`
- `Avatar` — 사용자 프로필 이미지

### Compound
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Dialog` — 모달 (확인, 결과 표시)
- `Sheet` — 모바일 바텀시트
- `Toast` / `Sonner` — 알림
- `Form`, `FormField`, `FormMessage` — React Hook Form 연동
- `Select`, `Combobox` — 드롭다운

### Navigation
- `Tabs`, `TabsList`, `TabsTrigger`
- `DropdownMenu` — 헤더 사용자 메뉴
- `Breadcrumb` — 내부 페이지
- `Pagination` — 랭킹 페이지

### Feedback
- `Progress` — 채점 진행 상태
- `Skeleton` — 로딩 플레이스홀더
- `Alert` — 에러/경고 메시지

---

## 커스텀 컴포넌트

shadcn/ui에 없는 것만 직접 구현.

| 컴포넌트 | 위치 | 설명 |
|---|---|---|
| `ScoreBar` | `components/common/ScoreBar` | 5축 점수 막대 시각화 (가로 progress bar × 5) |
| `PersonaCard` | `components/persona/PersonaCard` | 가수 카드 (이미지 + 이름 + 장르 + 가중치 표시) |
| `RankingRow` | `components/ranking/RankingRow` | 랭킹 테이블 행 (순위 + 등락 + 닉네임 + 점수) |
| `RankBadge` | `components/ranking/RankBadge` | 1~3위 아이콘 (금/은/동) |
| `AudioPlayer` | `components/common/AudioPlayer` | 미니 오디오 재생 바 (HTML5 Audio) |
| `ScoreboardTimer` | `components/ranking/ScoreboardTimer` | 주간 마감 카운트다운 |
| `StatusStep` | `components/submission/StatusStep` | 채점 진행 단계 표시 (pending→scoring→scored) |
| `FeedbackCard` | `components/submission/FeedbackCard` | 페르소나 피드백 카드 (요약 + 강점/개선점 타임스탬프) |

---

## Layout 패턴

### 인증 레이아웃 (`(auth)/`)
```
배경: 전체화면 다크 그라디언트 (#0F0B2C → #1E1B4B)
중앙 카드: max-w-md, rounded-xl, bg-card
로고 상단 고정
```

### 대시보드 레이아웃 (`(dashboard)/`)
```
사이드바: 240px 고정 (데스크탑), 아이콘 전용 collapsed (태블릿)
  └── 로고 / 네비 메뉴 / 사용자 정보 + 크레딧 잔액
헤더: sticky top-0, 검색 + 알림 + 아바타
콘텐츠: flex-1, max-w-screen-xl, 내부 padding
모바일: 사이드바 → Sheet (스와이프 열기)
```

### 랜딩 레이아웃 (`/`)
```
헤더: sticky, 로고 좌측 / CTA 우측
섹션: Hero → 기능 소개 → 페르소나 → 랭킹 미리보기 → CTA
푸터: 링크 + 저작권
```

---

## 반응형 브레이크포인트

Tailwind 기본 사용.
| | 크기 |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

모바일 우선(mobile-first). 주요 조정:
- 사이드바: `lg:flex hidden` → 모바일 Sheet
- 랭킹 테이블: 모바일에서 닉네임 + 점수만 노출
- 카드 그리드: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
