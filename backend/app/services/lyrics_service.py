import json
import logging
from dataclasses import dataclass
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

MIN_LYRICS_CHARS = 80
MAX_LYRICS_CHARS = 5000
MIN_LYRICS_LINES = 6
REQUIRED_SECTION_LABELS = ("[Verse", "[Chorus")


@dataclass(frozen=True)
class LyricsResult:
    lyrics: str
    provider: str
    model: str
    fallback_reason: str | None = None
    error_message: str | None = None


def _fallback_lyrics(theme: str, genre: str, mood: str) -> str:
    theme = theme or "우리의 밤"
    genre = genre or "K-POP"
    mood = mood or "따뜻한"
    return "\n".join([
        f"[Verse 1]\n{theme} 끝에서 너를 불러",
        f"{mood} 숨결처럼 번지는 melody",
        "익숙한 거리를 다시 걸으면",
        "내 마음은 한 박자 늦게 널 따라가",
        "",
        "[Pre-Chorus]\n말하지 못한 계절이 쌓여",
        "작은 불빛처럼 흔들려도",
        "",
        f"[Chorus]\nThis is my {genre} song for you",
        "너의 이름을 리듬 위에 올려",
        "오늘의 떨림이 내일의 노래가 돼",
        "다시, 다시 너에게 닿을게",
    ])


def _fallback_result(
    theme: str,
    genre: str,
    mood: str,
    reason: str,
    error_message: str | None = None,
) -> LyricsResult:
    return LyricsResult(
        lyrics=_fallback_lyrics(theme, genre, mood),
        provider="fallback",
        model="rule-v1",
        fallback_reason=reason,
        error_message=error_message,
    )


def _create_openai_client(api_key: str):
    from openai import OpenAI

    return OpenAI(api_key=api_key)


def _parse_lyrics_response(raw: str) -> str:
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("OpenAI response must be a JSON object")
    lyrics = data.get("lyrics")
    if not isinstance(lyrics, str):
        raise ValueError("OpenAI response missing string lyrics")
    return lyrics.strip()


def _quality_issue(lyrics: str) -> str | None:
    if len(lyrics) < MIN_LYRICS_CHARS:
        return "Generated lyrics are too short"
    if len(lyrics) > MAX_LYRICS_CHARS:
        return "Generated lyrics are too long"
    non_empty_lines = [line for line in lyrics.splitlines() if line.strip()]
    if len(non_empty_lines) < MIN_LYRICS_LINES:
        return "Generated lyrics do not have enough lines"
    if not all(label in lyrics for label in REQUIRED_SECTION_LABELS):
        return "Generated lyrics missing required section labels"
    if "http://" in lyrics or "https://" in lyrics:
        return "Generated lyrics include a URL"
    return None


def _build_generation_metadata(theme: str, genre: str, mood: str, keywords: list[str] | None) -> dict[str, Any]:
    return {
        "theme": theme,
        "genre": genre,
        "mood": mood,
        "keywords": keywords or [],
        "quality_rules": {
            "min_chars": MIN_LYRICS_CHARS,
            "max_chars": MAX_LYRICS_CHARS,
            "min_lines": MIN_LYRICS_LINES,
            "required_section_labels": list(REQUIRED_SECTION_LABELS),
        },
    }


def generate_lyrics(
    theme: str,
    genre: str,
    mood: str,
    keywords: list[str] | None = None,
) -> LyricsResult:
    if not settings.openai_api_key:
        return _fallback_result(theme, genre, mood, "OPENAI_API_KEY is not configured")

    try:
        client = _create_openai_client(settings.openai_api_key)
        keyword_text = ", ".join(keywords or [])
        response = client.responses.create(
            model=settings.lyrics_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You write original Korean K-POP demo lyrics. Keep syllable rhythm singable, "
                        "use clear section labels, avoid copyrighted lyric imitation, avoid unsafe sexual or violent content, "
                        "and return JSON only. Include at least [Verse 1] and [Chorus]."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Theme: {theme}\nGenre: {genre}\nMood: {mood}\n"
                        f"Keywords: {keyword_text}\n"
                        "Return {\"lyrics\":\"...\"} with original Korean lyrics."
                    ),
                },
            ],
            text={"format": {"type": "json_object"}},
            metadata=_build_generation_metadata(theme, genre, mood, keywords),
        )
        lyrics = _parse_lyrics_response(response.output_text)
        issue = _quality_issue(lyrics)
        if issue:
            return _fallback_result(theme, genre, mood, issue)
        return LyricsResult(lyrics=lyrics, provider="openai", model=settings.lyrics_model)
    except Exception as exc:
        logger.exception("OpenAI lyrics generation failed")
        return _fallback_result(
            theme,
            genre,
            mood,
            "OpenAI lyrics generation failed",
            str(exc)[:500],
        )
