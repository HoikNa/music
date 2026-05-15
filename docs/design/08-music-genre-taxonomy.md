# Music Genre Taxonomy

현재 플랫폼의 음원 저장, 제출, 차트 표출, 탐색 필터, AI Studio 입력은 아래 공식 장르 코드를 기준으로 처리한다.

| Code | Display | Scope |
| --- | --- | --- |
| `VOVATAR_POP` | Pop | VOVATAR Vocal-Avatar 하위 장르 |
| `VOVATAR_POP_BALLARD` | Pop / Pop Ballard | VOVATAR Vocal-Avatar 하위 장르 |
| `VOVATAR_ROCK` | Rock | VOVATAR Vocal-Avatar 하위 장르 |
| `VOVATAR_METAL` | Metal | VOVATAR Vocal-Avatar 하위 장르 |
| `VOVATAR_EDM` | EDM | VOVATAR Vocal-Avatar 하위 장르 |
| `VOVATAR_HIP_HOP` | Hip-Hop | VOVATAR Vocal-Avatar 하위 장르 |
| `VOVATAR_RNB_SOUL` | R&B / Soul | VOVATAR Vocal-Avatar 하위 장르 |
| `VOVATAR_CLASSICAL` | Classical | VOVATAR Vocal-Avatar 하위 장르 |
| `VOVATAR_JAZZ` | Jazz | VOVATAR Vocal-Avatar 하위 장르 |
| `VOVATAR_BLUES` | Blues | VOVATAR Vocal-Avatar 하위 장르 |
| `VOVATAR_FOLK` | Folk | VOVATAR Vocal-Avatar 하위 장르 |
| `OBD` | OBD / Remake | Oldies But Goodies / Remake |
| `INSTRUMENTAL` | INSTRUMENTAL | Instrumental |
| `LO_FI` | LO-FI | Low Fidelity, ASMR, New Age, Ambient, Meditation |
| `CCM` | CCM | Contemporary Christian Music |
| `AI_M` | AI-M | Fully AI Generated Music |
| `MMP` | MMP | My Music Playlist |
| `COVO` | COVO | Coming out of the Vertual Owl |

백엔드는 `backend/app/constants/genres.py`의 코드를 저장 기준으로 검증하고, 프론트엔드는 `frontend/src/lib/musicGenres.ts`의 동일 체계를 화면 표출과 필터에 사용한다.

---

## 사용처

- Backend 저장/검증: `backend/app/constants/genres.py`
- Frontend 표시/필터: `frontend/src/lib/musicGenres.ts`
- API: `GET /api/v1/submissions/genres`
- 적용 화면: 제출, 탐색, 랭킹 필터, AI Studio preset/genre select, mock data

---

## Alias 정규화

기존 데이터와 사용자 입력 호환을 위해 백엔드는 일부 legacy label을 공식 코드로 정규화한다.

| Alias | Canonical Code |
| --- | --- |
| `Pop`, `K-POP`, `City Pop`, `팝` | `VOVATAR_POP` |
| `Ballad`, `발라드`, `Pop Ballad`, `Pop Ballard`, `K-Indie Ballad` | `VOVATAR_POP_BALLARD` |
| `K-Indie`, `Folk` | `VOVATAR_FOLK` |
| `R&B`, `RNB`, `Soul`, `R&B / Soul` | `VOVATAR_RNB_SOUL` |
| `Rock`, `록` | `VOVATAR_ROCK` |
| `Hip-Hop`, `Hiphop`, `힙합` | `VOVATAR_HIP_HOP` |
| `Jazz`, `재즈` | `VOVATAR_JAZZ` |
| `OBD`, `Remake`, `Oldies But Goodies` | `OBD` |
| `Lo-fi`, `Ambient`, `Meditation`, `ASMR`, `New Age` | `LO_FI` |

Frontend도 주요 한국어/legacy label을 화면 표시용으로 같은 canonical label에 매핑한다. 저장값은 항상 공식 code를 권장한다.
