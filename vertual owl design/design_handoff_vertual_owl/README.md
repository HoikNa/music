# Handoff: Vertual Owl — 음원 창작 플랫폼 리디자인

## Overview

Vertual Owl은 AI 작곡 + 협업 DAW + 콘테스트 + 유통/정산 + 디스커버리를 한 워크스페이스에서 다루는 음원 창작 플랫폼입니다. 이 핸드오프는 기존 보라/핑크 그라데이션 + 이모지 톤을 걷어내고 **화이트 + 워밍 무채색 + 단일 앰버 액센트** 기반의 차분하고 에디토리얼한 톤으로 6개 핵심 화면을 다시 짠 결과를 담고 있습니다.

리디자인의 핵심 의도:
- "조잡하고 싼 느낌"을 제거하고 **오래 봐도 좋은 정적인 리듬** 만들기
- 컬러 노이즈 제거 → 화이트/워밍 무채색 + 앰버 단일 액센트
- 글로시 그라데이션·이모지 전면 제거 → **1.5px stroke 라인 아이콘**과 **모노스페이스 캡션**
- **Instrument Serif 디스플레이 + Pretendard 본문**으로 헤드라인에 조용한 무게감 부여
- 넉넉한 여백 (애플닷컴 톤)

---

## About the Design Files

이 폴더의 파일들은 **HTML로 만든 디자인 레퍼런스**입니다 — 의도한 룩과 동작을 보여주는 프로토타입이며, 그대로 가져다 쓰는 production 코드가 아닙니다.

작업 방향:
- 타깃 코드베이스(React / Next.js / Vue / Svelte 등)의 **기존 컴포넌트 라이브러리·패턴 위에서 이 디자인을 재구현**해 주세요.
- 별도 환경이 아직 없다면, 프로젝트 성격상 가장 적합한 프레임워크(권장: **Next.js + Tailwind CSS + shadcn/ui** 또는 동급의 헤드리스 컴포넌트 + CSS-in-JS 조합)를 선택하고 그 위에 구현하세요.
- 디자인 토큰(컬러/타이포/스페이싱)은 이 README의 토큰 섹션 그대로 옮겨 단일 소스로 만들고, 컴포넌트는 토큰을 참조하도록 짜 주세요.

---

## Fidelity

**중간 해상도 와이어프레임 (mid-fi)**.

- 레이아웃·정보 위계·컴포넌트 구조·타이포그래피 시스템·컬러 토큰은 **확정**된 것으로 간주하고 정확히 재현해 주세요.
- 실 콘텐츠(곡명, 아티스트, 숫자)와 커버 아트는 **플레이스홀더**입니다 (대각선 줄무늬 + 그라데이션 면). 실제 데이터/이미지로 교체해 주세요.
- 마이크로 인터랙션(트랜지션 곡선, 정확한 호버 변화량)은 본 디자인의 의도(120–200ms, ease-out 류)를 따르되 코드베이스 표준이 있다면 그것을 우선합니다.

---

## Design Tokens

### Color

```
/* Surfaces — warm neutrals, NOT cool grays */
--paper:        #FAFAF7   /* app background */
--card:         #FFFFFF   /* card background */
--tint:         #F4F3EE   /* subtle wash, hover */
--tint-2:       #EDEBE3   /* divider wash, scrollbar */
--line:         #E8E5DC   /* hairline border */
--line-soft:    #F0EDE5   /* soft divider */

/* Ink (text) */
--ink-0:        #15140F   /* primary text */
--ink-1:        #3A382F   /* body */
--ink-2:        #6B695E   /* secondary */
--ink-3:        #9B988C   /* tertiary, captions */
--ink-4:        #C7C4B7   /* disabled, faint marks */

/* Single Accent — Warm Amber */
--amber:        #B8722C   /* primary action, links, highlights */
--amber-d:      #8E5419   /* hover */
--amber-l:      #E5C99A   /* tint */
--amber-bg:     #F6EBD9   /* badge background */

/* Functional — desaturated, used VERY sparingly */
--good:         #4F6B3F
--warn:         #B8722C   /* alias of amber */
--bad:          #9B3D2E
```

**규칙**: 그레이는 cool gray가 아니라 워밍 톤. 그라데이션은 placeholder 커버 아트에만 허용. 다른 어떤 면도 단색.

### Typography

```
--sans:  "Pretendard Variable", "Pretendard", "Inter",
         -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
         system-ui, sans-serif

--serif: "Instrument Serif",
         "Pretendard Variable", "Pretendard", "Apple SD Gothic Neo",
         serif
         /* 한글 fallback이 Pretendard로 가게 의도 — Instrument Serif가
            한글 글리프가 없어 자연스럽게 모던 산세리프로 떨어짐 */

--mono:  ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace
```

**Type Scale**

| Token | Family | Size | Weight | Line | Letter |
|---|---|---|---|---|---|
| `.h-display` | serif | 44px | 400 | 1.05 | -0.025em |
| `.h-1` | serif | 32px | 400 | 1.1 | -0.02em |
| `.h-2` | serif | 22px | 400 | 1.2 | -0.015em |
| `.h-3` | sans | 15px | 600 | 1.4 | -0.01em |
| body | sans | 14px | 400 | 1.55 | -0.011em |
| body-sm | sans | 13px | 400 | 1.55 | — |
| caption | sans | 12px | 400 | 1.4 | — |
| `.label-mono` | mono | 11px | 400 | 1.4 | 0.10em, UPPERCASE |

**Italic display**: `<em>` 안의 텍스트는 명시적으로 `font-family: "Instrument Serif"; font-style: italic; color: var(--amber)` 적용 — 한글이 옆에 와도 영문/숫자만 세리프-이탤릭으로 빠지고 한글은 Pretendard로 폴백.

본문 OpenType: `font-feature-settings: "ss01", "tnum"` (Pretendard SS01 + tabular nums).

### Spacing & Geometry

```
--r-xs: 6px
--r-sm: 10px
--r-md: 14px
--r-lg: 22px
--r-xl: 32px

/* 999px (pill) — 버튼/태그 일부에만, 자제 */
```

Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48 / 56 / 64 / 80 / 120.

### Shadow (barely there)

```
--sh-sm: 0 1px 0 rgba(21,20,15,.04), 0 1px 2px rgba(21,20,15,.03)
--sh-md: 0 1px 0 rgba(21,20,15,.04), 0 8px 24px -8px rgba(21,20,15,.10)
--sh-lg: 0 30px 60px -20px rgba(21,20,15,.18)
```

### Layout Constants

```
--sidebar-w: 220px
--topbar-h:  64px
artboard:    1280 × 820 (canvas viewport)
```

---

## App Shell (모든 화면 공통)

CSS Grid로 정의:
```
grid-template-columns: 220px 1fr
grid-template-rows:    64px  1fr
grid-template-areas:
  "side top"
  "side main"
```

### Sidebar (`.side`)
- 배경 `--card`, 우측 1px `--line`
- 패딩: 22px 16px 16px
- 컴포넌트 순서:
  1. **Brand mark + name** — owl 모노그램 SVG (26×26) + "Vertual Owl" (Instrument Serif 19px / 400)
  2. **Workspace 그룹**: Dashboard / AI Studio / Creator Studio / Library
  3. **Network 그룹**: Contest / Distribution / Explore / Collaborators
  4. **Credit block** (sticky bottom): 라벨/숫자 + 2px progress bar + "크레딧 충전" 링크
- 각 그룹 위에 `.nav-cap` (mono 10px / 0.12em / UPPERCASE / `--ink-3`)
- `.nav-item` — 8px 10px, radius 10px, 13px / 450
  - default: `--ink-1`
  - hover: bg `--tint`, color `--ink-0`
  - **active**: bg `--ink-0`, color `--paper` (잉크 블랙 알약)
  - 알림 도트(`.ndot`): 우측, 6px 앰버 원

### Topbar (`.top`)
- 높이 64px, `--card`, 하단 1px `--line`, padding 0 32px
- 좌측: `.crumb` (mono 11px / UPPERCASE) — `Workspace · **Page**` 형식
- 우측 정렬: 280px pill search → 아이콘 버튼들 (bell with amber dot, settings) → 32px avatar

### Main (`.main`)
- 패딩: 48px 56px (dense 모드 32px 36px)
- 각 페이지의 첫 블록은 hero/heading + 24~48px 하단 보더 `--line`, margin-bottom 48~56px

---

## Screens

### 01 Dashboard
**Purpose**: 아침 첫 화면. 한 호흡 안에 "오늘 무엇을 이어갈지" 보이게.

**Layout**:
1. **Greeting hero** (1fr / auto grid, gap 40, padding-bottom 40, border-bottom)
   - 좌: timestamp (mono caps) → `<h-display>` 인사말 (이탤릭 곡 제목 강조) → "v.3 · 78%" pill + 자동저장 캡션
   - 우: AI 작곡 (ghost) + 스튜디오 열기 (primary, 잉크 블랙)
2. **Stat row** — 4-col equal grid, 1px gutters (`--line` bg + cards)
   - 발매 곡 / 이번 달 수익 / 스트리밍 / 팔로워
   - 각 stat: 라벨 11.5px → 값 serif 30px / 400 → delta 11.5px (`--good`, +↑ 아이콘)
3. **Two-col grid** (1.7fr / 1fr, gap 56)
   - 좌: 진행 중인 프로젝트 (3개) + Contest feature row (cream card with amber CTA)
   - 우: 최근 활동 피드 (5 items, 6px marker dot + 본문 + mono timestamp)

**Project row** (proj):
- 56px 커버 (gradient placeholder, radius 10) — 1fr 정보 — auto 우측 메타
- 정보: title 15px / 500 → meta (장르 · 길이 · BPM · Key · 시간) → 2px progress bar with amber/ink fill + mono pct
- 우측: 24px overlapping avatars + 상태 tag

**Contest feature row**: white card, radius 22, padding 28 32, eyebrow (amber mono) → serif title 26 → sub → amber CTA.

### 02 AI Studio
**Purpose**: 한 문장과 몇 개 칩 선택으로 곡 생성.

**Layout**:
1. **Editorial hero** — `<h-display>` "한 문장이면 충분합니다." + 본문 2줄
2. **Tabs** (`.ai-tabs`): 작곡 / 가사 / 가상 보컬 / 마스터링 — 14×22 padding, active = ink-0 + 1px bottom border
3. **2-col form** (gap 56)
   - 좌: 장르 칩 / 분위기 칩 / 참고 곡 input
   - 우: BPM slider (값 serif 22) / Key 칩 / 길이 칩
   - 칩: 7×14 padding, 999px radius, 1px line; active = `--ink-0` bg, `--paper` text
4. **Prompt textarea** — 1px line, radius 14, focus ink-1
5. **Gen bar** (sticky tone, top/bottom 1px line) — 좌: "사용 크레딧 240 / 8,420 · Safety Filter" / 우: 앰버 primary CTA
6. **Results grid** — 2 cols, gap 24, 4 cards
   - 각 result: 56px round play (ink-0, hover amber) — info column (letter-mono "Variation A" amber → title 15/500 → mono meta → 32px waveform → divider → save / refresh / "스튜디오로" use button)

**Waveform**: 48 bars, container 32px tall, gap 2px. 각 bar 높이 = `sin(t·π) * 0.7 + 0.3` envelope × random. 색 `--ink-0`.

### 03 Creator Studio (DAW)
**Purpose**: 협업 가능한 트랙 편집. 잉크 블랙 리전 + 라인 보더로 구조 명확화.

**Layout**: 메인(1fr) / 우측 사이드(280px) — 우측 1px line
- **Header bar**: 곡명 serif 22 + ver-tag mono → 자동저장 + 메타 라인
- **Ruler**: 200px label / timeline 7 ticks (0:00–3:00)
- **Tracks** (7개): 200px label / canvas grid bg
  - Label: 트랙명 13/500 + M/S/R buttons (mono 9px, on=amber) + volume bar
  - Canvas: 7개 컬럼 grid, 리전을 `position: absolute; left%; width%` 로 배치
    - **Region styles**:
      - 기본 솔리드 잉크: bg `--ink-0`, color `--paper`
      - amber: bg `--amber`, color white
      - outline: card bg + 1px `--ink-1` (구조만)
      - outline-amber: amber-bg + 1px amber-l (AI 생성 트랙)
  - Comment pin: 16px 원, 보더 amber, top -10, comment 아이콘
- **Transport bar**: skip-back / 44px play (ink-0, hover amber) / skip-fwd / record(빨강) — 시간 serif 24 — 우측 BPM/KEY/LUFS

**Sidebar 4 blocks**:
1. **버전 히스토리** — current: ink-0 row (paper text)
2. **기여도/지분** — 12px 누적 바 (4색: ink-0 / amber / ink-2 / ink-4) + 4-row 리스트
3. **AI 제안** — 좌측 2px amber 보더 + mono 9.5 caps caption + body
4. **댓글** — tint 카드, 22px mini avatar + 이름 + mono time + 본문

### 04 Contest
**Purpose**: 진행 중인 콘테스트, 심사 가중치, 실시간 랭킹.

**Layout**:
1. **Editorial hero** — eyebrow (amber mono "Spring 2026 · Ongoing · D-7") → `.ct-title` 64px serif (이탤릭 강조) → sub → CTA pair → 우측 stats 3개 (상금 amber serif 32 / 참가팀 / 투표)
2. **Judge grid** — 3-col, 1px gutters, 각 카드 28 padding
   - 헤드: 라벨 14/500 + 가중치 serif 28 ("20%")
   - 상태 본문 + 2px progress (ink-0 또는 amber) + mono foot ("COMPLETED" / "124 / 200")
3. **Leaderboard** — 6 rows
   - Grid: `60 56 1fr 90 90 100`
   - Rank: serif 22, top1=amber, top2-3=ink-0, 나머지 ink-3
   - 48 cover, title 14/500 + artist 12 ink-3
   - AI / VOTES mono 12, SCORE serif 18 bold
   - "내 곡" 행은 `--amber-bg` 배경 + tag

### 05 Distribution
**Purpose**: 수익/스트리밍 대시보드.

**Layout**:
1. **Dist head** (1.6fr / 1fr grid, gap 56, padding-bottom 48)
   - 좌: 캡션 → serif 64 KRW 총액 → +YoY 델타(`--good`) → 4-탭 필터(일/주/월/연) → 12-bar chart (현재 달=amber, 호버 ink-1)
   - 우: DSP 카드 (border, 24 padding) — 6px 누적 bar (5색) + 5-row 리스트 (10px swatch + 이름 + mono pct)
2. **Track table** — `48 1.6fr 100 160 90 110 24` grid
   - Cover 44 / 제목 14·아티스트 12 / 상태 tag (with leading dot) / DSP 6-badge cluster (22×22, mono initial) / mono 스트리밍 / mono 수익(bold) / kebab

### 06 Explore
**Purpose**: 매거진 톤 디스커버리.

**Layout**:
1. **Featured hero** (1fr / auto grid, gap 56, padding 64 0 56)
   - 좌: eyebrow (amber mono "Featured · 이주의 신인") → `.ex-title` 56 serif (이탤릭 강조) → 아티스트 16 → 본문 14 → 액션 3개 (Play primary / Follow ghost / Share icon)
   - 우: 320×320 EP cover placeholder
2. **오늘의 신곡** — 4-col grid
   - 1:1 cover, top-left amber NEW tag, hover에서 우하단 40px paper play 버튼이 6px 위로 + 페이드 인
   - title 14/500 + artist 12 ink-3
3. **주목할 아티스트** — 5-col grid, 동그란 1:1 placeholder + 13/500 이름 + 11.5 ink-3 장르

---

## Components Catalogue

### Buttons
- **`.btn-primary`** — 잉크 블랙 알약, hover ink-1
- **`.btn-amber`** — amber 알약, hover amber-d
- **`.btn-ghost`** — card bg, 1px line, hover border ink-1
- **`.btn-text`** — 6×4 padding, hover amber
- 모두 13/500, gap 8, 999px, 10×18

### Tags
- **default** — tint bg, ink-2, 1px line-soft, mono 10.5 / 0.06em / UPPERCASE
- **amber** — amber-bg + amber-d + amber-l 보더
- **ink** — ink-0 bg + paper text
- **dot variant** — `::before`로 5px currentColor 점 (상태 표시)

### Surface
- `.surface` — `--card` + 1px `--line` + radius 14

### Placeholder (`.ph`)
- 디자인 와이어프레임의 모든 이미지 슬롯
- 기본: 135deg 9/10px 줄무늬 위 `--tint`, 1px line, mono 10 caps 라벨
- 변형 k1~k7: 따뜻한 ink/amber 그라데이션 (커버 아트 자리)
- k4: 페이퍼 그라데이션 (밝은 자리), k8: 단순 tint
- 실제 코드에선 `<img>` + skeleton fallback으로 교체

### Icon Set
1.5px stroke 라인 아이콘, 24×24 viewBox, currentColor, round caps/joins.
HTML에서 `<symbol id="i-...">` 정의 후 `<use href="#i-..."/>`로 참조.

이름: home, spark, wave, trophy, chart, compass, search, bell, play, pause, skip-back, skip-fwd, rec, arrow-r, up, down, plus, comment, share, save, refresh, more, mic, folder, people, set.

**Brand mark (`#brand-owl`)**: 24×24, 외곽 r=10.5 stroke, 두 눈 r=1.6 fill, 아래 호 — 미니멀 모노그램.

---

## Interactions & Behavior

### Transitions (default)
- Color/border: 120ms
- Opacity/transform: 200ms ease-out

### Hover states
- nav-item / icon-btn: bg `--tint`
- chip: border ink-1
- proj row: title → amber
- result-play: scale(1.04) + bg amber
- tg-card: play button 6px 위로 + 페이드 인 (200ms)

### Focus
- input/textarea: border `--ink-1` (no glow, no shadow)

### Tweakable axes (디자인 검증용 — 프로덕션엔 불필요)
- View 필터 (페이지 단독 보기)
- Accent hue (oklch hue / chroma slider)
- Serif mode: Instrument / Pretendard / Sans only
- Density toggle (main padding 48/56 ↔ 32/36)

---

## Page Specifics — Copy

핸드오프 HTML에 있는 한국어 카피는 시안 검증용 더미입니다 — 실 카피는 PM과 합의 후 배치. Tone & voice 가이드:
- 헤드라인: 짧고 차분한 평서문, 이탤릭으로 한 단어만 강조
- 캡션: mono caps + 영문 시간/날짜 표기 ("2 HOURS AGO", "TUESDAY · MAY 5")
- CTA: 동사 + 화살표 ("출품하기 →", "스튜디오로 →")

---

## State Management

각 화면에 필요한 데이터 모델 (개략):

- **Dashboard**: User, Stats(period), Projects[], ActivityFeed[], FeaturedContest
- **AI Studio**: GenerationConfig{genre[], mood[], tempo, key, length, prompt}, GenerationResult[]{id, title, meta, waveform[], audioUrl}
- **Creator Studio**: Project{tracks[], regions[]}, VersionHistory[], Contributors[]{share, role}, AIInsights[], Comments[]{trackId, position, body, author}
- **Contest**: Contest{period, prize, deadline, judging weights}, Entries[]{rank, scores}
- **Distribution**: Revenue timeseries, DSPBreakdown, Releases[]{status, dsps[], streams, revenue}
- **Explore**: Featured, NewReleases[], Artists[]

---

## Recommended Stack (if greenfield)

- **Next.js 14+ App Router**
- **Tailwind CSS** — 위 토큰을 `tailwind.config.ts`의 theme.extend로 매핑
  - colors: `paper`, `card`, `tint`, `tint-2`, `line`, `line-soft`, `ink-{0..4}`, `amber`/`amber-d`/`amber-l`/`amber-bg`
  - fontFamily: `sans` / `serif` / `mono` (위 토큰 그대로)
  - borderRadius: `xs:6 sm:10 md:14 lg:22 xl:32`
- **shadcn/ui** — Button, Tabs, Slider, Avatar 베이스로 사용 (스타일은 본 토큰으로 오버라이드)
- **lucide-react** — 본 디자인의 라인 아이콘은 lucide와 1:1 매칭됨 (Home, Sparkles, Waveform, Trophy, BarChart3, Compass, Search, Bell, Play, Pause, SkipBack, SkipForward, Circle, ArrowRight, ChevronUp, ChevronDown, Plus, MessageCircle, Share2, Save, RefreshCw, MoreHorizontal, Mic, Folder, Users, Settings)
- **framer-motion** — hover/탭 전환 정도만, 과하게 쓰지 마세요
- **Web Audio API** + **wavesurfer.js** — DAW 트랙 영역 (와이어프레임의 region을 실제 오디오 buffer로 교체)

---

## Files in This Bundle

- `Vertual Owl Redesign.html` — 6개 화면 전체를 단일 캔버스에 펼친 디자인 시안. 우측 하단 Tweaks 패널로 페이지 단독 보기·액센트·세리프 모드·밀도 토글 가능.
- `tweaks-panel.jsx` — 디자인 검증용 컴포넌트. 프로덕션 코드에는 포함하지 않습니다.
- `README.md` — 이 문서.

`Vertual Owl Redesign.html`을 브라우저에서 열어 의도된 룩을 직접 확인한 뒤, 본 README의 토큰·컴포넌트 명세를 기준으로 구현해 주세요.

---

## Notes for Implementation

1. **Cool gray 사용 금지** — 모든 회색은 #FAFAF7 ↔ #15140F 사이의 워밍 톤. 단 한 군데라도 cool gray가 들어가면 톤이 무너집니다.
2. **그라데이션은 placeholder에만** — 실 UI 면은 단색.
3. **이모지 절대 사용 금지** — 모든 시각 기호는 라인 아이콘으로.
4. **Border만으로 구조 잡기** — shadow 남발 금지. `--sh-md` 정도가 최대.
5. **숫자는 무조건 mono 또는 serif** — 본문 sans로 숫자를 쓰지 마세요. tabular nums(`tnum`) feature 활성.
6. **이탤릭은 영문/숫자 한정** — 한글에 이탤릭 적용 금지(자동 폴백되도록 `font-family` 명시).
7. **반응형**은 본 시안 범위 밖. 우선 1280px artboard 기준 데스크톱부터 구현하고, 모바일은 별도 디자인 라운드로.
