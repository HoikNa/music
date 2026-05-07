from app.config import settings


def generate_demo_track(
    prompt: str,
    genre: str,
    mood: str,
    duration_sec: int,
) -> dict:
    provider = settings.music_generation_provider
    if provider != "mubert" or not settings.mubert_api_key:
        return {
            "status": "skipped",
            "provider": "mock",
            "audio_url": None,
            "message": "Music generation provider is not configured",
            "metadata": {
                "prompt": prompt,
                "genre": genre,
                "mood": mood,
                "duration_sec": duration_sec,
            },
        }

    return {
        "status": "skipped",
        "provider": "mubert",
        "audio_url": None,
        "message": "Mubert provider adapter is ready for API credential mapping",
        "metadata": {
            "prompt": prompt,
            "genre": genre,
            "mood": mood,
            "duration_sec": duration_sec,
        },
    }
