export type MusicGenre = {
  code: string
  label: string
}

export type MusicGenreGroup = {
  code: string
  label: string
  description: string
  children: MusicGenre[]
}

export const MUSIC_GENRE_GROUPS: MusicGenreGroup[] = [
  {
    code: "VOVATAR",
    label: "VOVATAR",
    description: "Vocal-Avatar 장르별",
    children: [
      { code: "VOVATAR_POP", label: "Pop" },
      { code: "VOVATAR_POP_BALLARD", label: "Pop / Pop Ballard" },
      { code: "VOVATAR_ROCK", label: "Rock" },
      { code: "VOVATAR_METAL", label: "Metal" },
      { code: "VOVATAR_EDM", label: "EDM" },
      { code: "VOVATAR_HIP_HOP", label: "Hip-Hop" },
      { code: "VOVATAR_RNB_SOUL", label: "R&B / Soul" },
      { code: "VOVATAR_CLASSICAL", label: "Classical" },
      { code: "VOVATAR_JAZZ", label: "Jazz" },
      { code: "VOVATAR_BLUES", label: "Blues" },
      { code: "VOVATAR_FOLK", label: "Folk" },
    ],
  },
  { code: "OBD", label: "OBD / Remake", description: "Oldies But Goodies / Remake", children: [] },
  { code: "INSTRUMENTAL", label: "INSTRUMENTAL", description: "Instrumental", children: [] },
  { code: "LO_FI", label: "LO-FI", description: "Low Fidelity, ASMR, New Age, Ambient, Meditation", children: [] },
  { code: "CCM", label: "CCM", description: "Contemporary Christian Music", children: [] },
  { code: "AI_M", label: "AI-M", description: "Fully AI Generated Music", children: [] },
  { code: "MMP", label: "MMP", description: "My Music Playlist", children: [] },
  { code: "COVO", label: "COVO", description: "Coming out of the Vertual Owl", children: [] },
]

export const MUSIC_GENRES: MusicGenre[] = MUSIC_GENRE_GROUPS.flatMap((group) =>
  group.children.length > 0 ? group.children : [{ code: group.code, label: group.label }]
)

export const MUSIC_GENRE_FILTERS: MusicGenre[] = [
  { code: "all", label: "전체" },
  ...MUSIC_GENRES,
]

const MUSIC_GENRE_ALIASES: Record<string, string> = {
  "팝": "VOVATAR_POP",
  "K-POP": "VOVATAR_POP",
  "City Pop": "VOVATAR_POP",
  "발라드": "VOVATAR_POP_BALLARD",
  "팝/발라드": "VOVATAR_POP_BALLARD",
  "K-Indie Ballad": "VOVATAR_POP_BALLARD",
  "K-Indie": "VOVATAR_FOLK",
  "R&B": "VOVATAR_RNB_SOUL",
  "R&B/소울": "VOVATAR_RNB_SOUL",
  "댄스/팝": "VOVATAR_POP",
  "댄스": "VOVATAR_EDM",
  "인디": "VOVATAR_FOLK",
  "록": "VOVATAR_ROCK",
  "재즈": "VOVATAR_JAZZ",
}

export function musicGenreLabel(code?: string | null) {
  if (!code) return ""
  const canonicalCode = MUSIC_GENRE_ALIASES[code] ?? code
  return MUSIC_GENRES.find((genre) => genre.code === canonicalCode)?.label ?? code
}
