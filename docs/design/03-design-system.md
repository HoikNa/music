# 03. Design System

shadcn/ui 기반. 커스터마이징 정의만 기술 — 직접 컴포넌트 구현 금지.
브랜드 컨셉: 화이트 + 워밍 무채색 + 단일 앰버 액센트. 에디토리얼·차분한 톤.

---

## Foundation

### Color Palette

TailwindCSS CSS Variables 방식 (`globals.css`에서 정의).

**Surfaces — warm neutrals (cool gray 사용 금지)**
| Token | Hex | 용도 |
|---|---|---|
| `--paper` | #FAFAF7 | 앱 배경 |
| `--card` | #FFFFFF | 카드 배경 |
| `--tint` | #F4F3EE | hover wash, subtle 배경 |
| `--tint-2` | #EDEBE3 | 구분선 배경, 스크롤바 |
| `--line` | #E8E5DC | hairline 보더 |
| `--line-soft` | #F0EDE5 | soft 구분선 |

**Ink (text)**
| Token | Hex | 용도 |
|---|---|---|
| `--ink-0` | #15140F | primary 텍스트 |
| `--ink-1` | #3A382F | body |
| `--ink-2` | #6B695E | secondary |
| `--ink-3` | #9B988C | tertiary, caption |
| `--ink-4` | #C7C4B7 | disabled, faint |

**Amber — 단일 액센트 (다른 포인트 컬러 사용 금지)**
| Token | Hex | 용도 |
|---|---|---|
| `--amber` | #B8722C | primary action, 링크, 강조 |
| `--amber-d` | #8E5419 | hover |
| `--amber-l` | #E5C99A | tint |
| `--amber-bg` | #F6EBD9 | 배지 배경 |

**Semantic**
| Token | Hex | 용도 |
|---|---|---|
| `--good` | #4F6B3F | 성공, 완료 |
| `--warn` | #B8722C | 경고 (amber alias) |
| `--bad` | #9B3D2E | 오류 |

**shadcn/ui 브리지 (globals.css에서 위 토큰으로 매핑됨)**
```
--background  → --paper
--foreground  → --ink-0
--card        → #FFFFFF
--primary     → --ink-0
--accent      → --amber
--border      → --line
--muted       → --tint
```

---

### Typography

**폰트 패밀리**
```
--font-sans:  "Pretendard Variable", -apple-system, "Apple SD Gothic Neo", sans-serif
--font-serif: "Instrument Serif", Georgia, "Pretendard Variable", serif
              (한글은 Pretendard로 자동 폴백)
--font-mono:  ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace
```

`layout.tsx`에서 `next/font/google`으로 Playfair Display 로드 (serif fallback용).

**Type Scale**
| 클래스 | 패밀리 | 크기 | 굵기 | 용도 |
|---|---|---|---|---|
| `.h-display` | serif | 44px | 400 | 페이지 히어로 제목 |
| `.h-1` | serif | 32px | 400 | 섹션 제목 |
| `.h-2` | serif | 22px | 400 | 카드 제목 |
| `.h-3` (Tailwind) | sans | 15px | 600 | 그룹 헤더 |
| body | sans | 14px | 400 | 기본 텍스트 |
| body-sm | sans | 13px | 400 | 보조 텍스트 |
| `.label-mono` | mono | 11px | 400 | UPPERCASE 캡션, 태그 |
| `.metric-label` | sans | 11px | 400 | 지표 레이블 |
| `.metric-value` | serif | 가변 | 400 | 지표 숫자 (serif) |

**이탤릭 규칙**: `<em>` 안 텍스트 → `font-family: "Instrument Serif"; font-style: italic; color: var(--amber)`. 한글은 옆에 와도 자동으로 Pretendard 폴백.

**OpenType**: `font-feature-settings: "ss01", "tnum"` (body에 전역 적용)

---

### Spacing & Geometry

```
--r-xs: 6px   (배지, 태그)
--r-sm: 10px  (버튼, 인풋, nav-item)
--r-md: 14px  (카드: .app-card)
--r-lg: 22px  (리프트 카드: .app-card-lift)
--r-xl: 32px  (large modal)
```

Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48 / 56 / 64 / 80 / 120

**Layout Constants**
```
--sidebar-w: 220px
--topbar-h:  64px
```

---

### Shadow

```
--sh-sm: 0 1px 0 rgba(21,20,15,.04), 0 1px 2px rgba(21,20,15,.03)
--sh-md: 0 1px 0 rgba(21,20,15,.04), 0 8px 24px -8px rgba(21,20,15,.10)
--sh-lg: 0 30px 60px -20px rgba(21,20,15,.18)
```

Shadow 최대치: `--sh-md`. 그 이상 사용 금지.

---

## 컴포넌트 시스템

### App Shell (globals.css)

```css
.app-shell       /* --paper 배경 */
.app-card        /* --card + 1px --line + --r-md + --sh-sm */
.app-card-lift   /* --card + 1px --line + --r-lg + --sh-md */
.soft-panel      /* .app-card alias */
.auth-surface    /* paper + subtle grid 패턴 (인증 페이지 배경) */
```

### Buttons (`.vo-btn` 계열)

| 클래스 | 배경 | 텍스트 | 용도 |
|---|---|---|---|
| `.vo-btn-primary` | `--ink-0` | `--paper` | Primary CTA |
| `.vo-btn-amber` | `--amber` | white | 보조 CTA |
| `.vo-btn-ghost` | `--card` + 1px line | `--ink-1` | tertiary |

모두: 13px / 500, gap 8, radius 999px, padding 10px 18px, transition 120ms

### Tags (`.vo-tag` 계열)

| 클래스 | 배경 | 색상 | 용도 |
|---|---|---|---|
| `.vo-tag` | `--tint` | `--ink-2` | 일반 태그, mono 10.5px |
| `.vo-tag-amber` | `--amber-bg` | `--amber-d` | 강조 태그 |

### Progress (`.vo-progress`)

```css
.vo-progress        /* --tint-2 배경, height 2px */
.vo-progress > span /* --ink-0 fill (width를 인라인 style로) */
```

### Placeholder (`.ph`)

```css
.ph     /* 대각선 줄무늬 + --tint 배경 (이미지 미로드 시) */
.ph-k1  /* ink-0 → #3a382f 그라디언트 */
.ph-k2  /* amber → #3a382f 그라디언트 */
.ph-k3  /* amber-bg → --tint-2 그라디언트 */
```

실제 이미지로 교체 시 `<img>` + Skeleton fallback 패턴 사용.

### Metrics

```css
.metric-label   /* ink-3, 11px, mono, UPPERCASE, 0.1em spacing */
.metric-value   /* ink-0, Instrument Serif */
```

---

## shadcn/ui 활용

직접 구현 금지. `npx shadcn@latest add [컴포넌트]`로 설치 후 CSS 변수 오버라이드만.

| 카테고리 | 컴포넌트 |
|---|---|
| Atomic | Button, Input, Badge, Checkbox, Switch, Slider, Avatar |
| Compound | Card, Dialog, Sheet, Toast/Sonner, Form+FormField+FormMessage, Select |
| Navigation | Tabs, DropdownMenu, Breadcrumb, Pagination |
| Feedback | Progress, Skeleton, Alert |

---

## 커스텀 컴포넌트

shadcn/ui에 없는 것만 직접 구현.

| 컴포넌트 | 위치 | 설명 |
|---|---|---|
| `ScoreBar` | `components/common/ScoreBar` | 5축 점수 막대 |
| `AuthGate` | `components/auth/AuthGate` | 인증 필요 페이지 래퍼 |
| `Providers` | `components/auth/Providers` | TanStack Query + Toast Provider |
| `Sidebar` | `components/layout/Sidebar` | 220px 사이드바 (nav + 크레딧 블록) |
| `Header` | `components/layout/Header` | 64px 상단 바 |

---

## Layout 패턴

### 인증 레이아웃 (`(auth)/`)
```
배경: .auth-surface (paper + subtle grid)
중앙 카드: max-w-md, .app-card-lift
```

### 대시보드 레이아웃 (`(dashboard)/`)
```
CSS Grid:
  grid-template-columns: 220px 1fr  (--sidebar-w / main)
  grid-template-rows:    64px  1fr  (--topbar-h / content)

사이드바: hidden lg:flex (모바일 대응 추후 별도 디자인 라운드)
콘텐츠: px-5 py-8 md:px-10 lg:px-14 lg:py-12
```

---

## 디자인 규칙 (필수 준수)

1. **Cool gray 금지** — 모든 회색은 #FAFAF7 ↔ #15140F 사이 워밍 톤
2. **그라디언트는 placeholder에만** — 실 UI 면은 단색
3. **이모지 금지** — 모든 시각 기호는 lucide-react 라인 아이콘
4. **Border로 구조** — shadow 남발 금지, `--sh-md`가 최대
5. **숫자는 mono 또는 serif** — body sans에 숫자 단독 사용 금지, `tnum` feature 활성
6. **이탤릭은 영문/숫자 한정** — 한글에 font-style: italic 직접 적용 금지
7. **반응형**: 1280px 데스크톱 우선, 모바일은 별도 라운드
