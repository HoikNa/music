import json

from app.config import settings


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


def generate_lyrics(
    theme: str,
    genre: str,
    mood: str,
    keywords: list[str] | None = None,
) -> tuple[str, str, str]:
    if not settings.openai_api_key:
        return _fallback_lyrics(theme, genre, mood), "fallback", "rule-v1"

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        keyword_text = ", ".join(keywords or [])
        response = client.responses.create(
            model=settings.lyrics_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You write Korean K-POP demo lyrics. Keep syllable rhythm singable, "
                        "use clear section labels, and return JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Theme: {theme}\nGenre: {genre}\nMood: {mood}\n"
                        f"Keywords: {keyword_text}\n"
                        "Return {\"lyrics\":\"...\"} with Korean lyrics."
                    ),
                },
            ],
            text={"format": {"type": "json_object"}},
        )
        data = json.loads(response.output_text)
        lyrics = str(data.get("lyrics", "")).strip()
        if lyrics:
            return lyrics, "openai", settings.lyrics_model
    except Exception:
        pass

    return _fallback_lyrics(theme, genre, mood), "fallback", "rule-v1"
