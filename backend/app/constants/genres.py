from __future__ import annotations

from typing import Any


MUSIC_GENRE_GROUPS: tuple[dict[str, Any], ...] = (
    {
        "code": "VOVATAR",
        "label": "VOVATAR",
        "description": "Vocal-Avatar 장르별",
        "children": (
            {"code": "VOVATAR_POP", "label": "Pop"},
            {"code": "VOVATAR_POP_BALLARD", "label": "Pop / Pop Ballard"},
            {"code": "VOVATAR_ROCK", "label": "Rock"},
            {"code": "VOVATAR_METAL", "label": "Metal"},
            {"code": "VOVATAR_EDM", "label": "EDM"},
            {"code": "VOVATAR_HIP_HOP", "label": "Hip-Hop"},
            {"code": "VOVATAR_RNB_SOUL", "label": "R&B / Soul"},
            {"code": "VOVATAR_CLASSICAL", "label": "Classical"},
            {"code": "VOVATAR_JAZZ", "label": "Jazz"},
            {"code": "VOVATAR_BLUES", "label": "Blues"},
            {"code": "VOVATAR_FOLK", "label": "Folk"},
        ),
    },
    {
        "code": "OBD",
        "label": "OBD / Remake",
        "description": "Oldies But Goodies / Remake",
        "children": (),
    },
    {
        "code": "INSTRUMENTAL",
        "label": "INSTRUMENTAL",
        "description": "Instrumental",
        "children": (),
    },
    {
        "code": "LO_FI",
        "label": "LO-FI",
        "description": "Low Fidelity, ASMR, New Age, Ambient, Meditation",
        "children": (),
    },
    {
        "code": "CCM",
        "label": "CCM",
        "description": "Contemporary Christian Music",
        "children": (),
    },
    {
        "code": "AI_M",
        "label": "AI-M",
        "description": "Fully AI Generated Music",
        "children": (),
    },
    {
        "code": "MMP",
        "label": "MMP",
        "description": "My Music Playlist",
        "children": (),
    },
    {
        "code": "COVO",
        "label": "COVO",
        "description": "Coming out of the Vertual Owl",
        "children": (),
    },
)

MUSIC_GENRES: tuple[dict[str, str], ...] = tuple(
    child
    for group in MUSIC_GENRE_GROUPS
    for child in (group["children"] or ({"code": group["code"], "label": group["label"]},))
)

MUSIC_GENRE_CODES = frozenset(genre["code"] for genre in MUSIC_GENRES)
MUSIC_GENRE_LABELS = {genre["code"]: genre["label"] for genre in MUSIC_GENRES}

_GENRE_ALIASES = {
    "pop": "VOVATAR_POP",
    "k-pop": "VOVATAR_POP",
    "city pop": "VOVATAR_POP",
    "팝": "VOVATAR_POP",
    "ballad": "VOVATAR_POP_BALLARD",
    "발라드": "VOVATAR_POP_BALLARD",
    "pop ballad": "VOVATAR_POP_BALLARD",
    "pop ballard": "VOVATAR_POP_BALLARD",
    "k-indie ballad": "VOVATAR_POP_BALLARD",
    "k-indie": "VOVATAR_FOLK",
    "rock": "VOVATAR_ROCK",
    "록": "VOVATAR_ROCK",
    "metal": "VOVATAR_METAL",
    "edm": "VOVATAR_EDM",
    "hip-hop": "VOVATAR_HIP_HOP",
    "hiphop": "VOVATAR_HIP_HOP",
    "힙합": "VOVATAR_HIP_HOP",
    "r&b": "VOVATAR_RNB_SOUL",
    "rnb": "VOVATAR_RNB_SOUL",
    "r&b / soul": "VOVATAR_RNB_SOUL",
    "soul": "VOVATAR_RNB_SOUL",
    "classical": "VOVATAR_CLASSICAL",
    "jazz": "VOVATAR_JAZZ",
    "재즈": "VOVATAR_JAZZ",
    "blues": "VOVATAR_BLUES",
    "folk": "VOVATAR_FOLK",
    "obd": "OBD",
    "oldies but goodies": "OBD",
    "remake": "OBD",
    "instrumental": "INSTRUMENTAL",
    "lo-fi": "LO_FI",
    "lo_fi": "LO_FI",
    "low fidelity": "LO_FI",
    "asmr": "LO_FI",
    "new age": "LO_FI",
    "ambient": "LO_FI",
    "meditation": "LO_FI",
    "ccm": "CCM",
    "ai-m": "AI_M",
    "ai_m": "AI_M",
    "fully ai generated music": "AI_M",
    "mmp": "MMP",
    "my music playlist": "MMP",
    "covo": "COVO",
    "coming out of the vertual owl": "COVO",
}


def normalize_genre(value: str) -> str:
    genre = value.strip()
    if genre in MUSIC_GENRE_CODES:
        return genre

    alias = _GENRE_ALIASES.get(genre.lower())
    if alias:
        return alias

    raise ValueError("unsupported music genre")


def genre_label(value: str) -> str:
    try:
        return MUSIC_GENRE_LABELS[normalize_genre(value)]
    except ValueError:
        return value
