import json
import logging
from dataclasses import dataclass
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

MIN_PLAN_CHARS = 300
MAX_PLAN_CHARS = 6000
REQUIRED_SECTIONS = ("요약", "편곡 타임라인", "코드 진행", "믹스 노트")


@dataclass(frozen=True)
class CompositionResult:
    status: str
    provider: str
    model: str
    output_text: str
    audio_url: str | None = None
    message: str | None = None
    fallback_reason: str | None = None
    error_message: str | None = None
    metadata: dict[str, Any] | None = None


def _create_openai_client(api_key: str):
    from openai import OpenAI

    return OpenAI(api_key=api_key)


def _genre_defaults(genre: str) -> tuple[int, str, str]:
    normalized = genre.lower()
    if "r&b" in normalized or "soul" in normalized:
        return 84, "A minor", "i7 - iv7 - VIImaj7 - V7"
    if "edm" in normalized:
        return 124, "F minor", "i - VI - III - VII"
    if "hip-hop" in normalized or "lo-fi" in normalized:
        return 92, "D minor", "i9 - iv9 - VImaj7 - V7"
    if "rock" in normalized or "metal" in normalized:
        return 136, "E minor", "i - VI - VII - i"
    if "jazz" in normalized or "blues" in normalized:
        return 76, "Bb major", "Imaj7 - vi7 - ii7 - V7"
    if "classical" in normalized:
        return 68, "G major", "I - V - vi - IV"
    return 96, "C major", "I - V - vi - IV"


def _timeline(duration_sec: int) -> list[tuple[str, str]]:
    intro = min(8, max(4, duration_sec // 10))
    verse_end = min(duration_sec, intro + max(12, duration_sec // 4))
    pre_end = min(duration_sec, verse_end + max(8, duration_sec // 8))
    chorus_end = min(duration_sec, pre_end + max(14, duration_sec // 4))
    outro_start = max(0, duration_sec - min(10, max(4, duration_sec // 8)))
    return [
        (f"0:00-{intro:02d}s", "Intro: 핵심 코드와 시그니처 톤을 2마디로 제시"),
        (f"0:{intro:02d}-{verse_end // 60}:{verse_end % 60:02d}", "Verse: 보컬/멜로디 공간을 넓게 두고 리듬을 절제"),
        (f"{verse_end // 60}:{verse_end % 60:02d}-{pre_end // 60}:{pre_end % 60:02d}", "Pre: 킥과 패드를 추가해 후렴 전 긴장감 상승"),
        (f"{pre_end // 60}:{pre_end % 60:02d}-{chorus_end // 60}:{chorus_end % 60:02d}", "Chorus: 훅 멜로디와 베이스를 전면 배치"),
        (f"{outro_start // 60}:{outro_start % 60:02d}-{duration_sec // 60}:{duration_sec % 60:02d}", "Outro: 보컬 애드립 또는 리드 악기 잔향으로 마무리"),
    ]


def _fallback_plan(prompt: str, genre: str, mood: str, duration_sec: int) -> str:
    tempo, key, chords = _genre_defaults(genre)
    timeline = "\n".join([f"- {timecode}: {description}" for timecode, description in _timeline(duration_sec)])
    return "\n".join([
        "## 요약",
        f"- 작업 주제: {prompt}",
        f"- 장르/무드: {genre} / {mood}",
        f"- 권장 템포/키: {tempo} BPM, {key}",
        "- 데모 목표: 보컬 탑라인이 먼저 들리고, 후렴에서 한 번에 기억되는 훅을 만드는 1분 초안",
        "",
        "## 편곡 타임라인",
        timeline,
        "",
        "## 코드 진행",
        f"- 메인 진행: {chords}",
        "- Verse: 루트음을 길게 유지해 가사 전달력을 확보",
        "- Chorus: 같은 진행을 유지하되 베이스 옥타브와 하이햇 밀도를 올려 에너지 상승",
        "",
        "## 멜로디 가이드",
        "- Verse 첫 줄은 3도 안쪽의 좁은 음역으로 말하듯 시작",
        "- Pre 마지막 마디에서 한 음을 길게 끌어 후렴 첫 박자 착지를 강조",
        "- Chorus 훅은 같은 리듬을 2회 반복하고 마지막 음만 상행 처리",
        "",
        "## 사운드 디자인",
        "- 킥은 짧고 단단하게, 베이스는 보컬 저역과 충돌하지 않게 90Hz 아래를 정리",
        "- 메인 악기는 피아노/패드/기타 중 하나만 전면 배치하고 나머지는 보조 레이어로 사용",
        "- 후렴 진입 직전 1박 무음 또는 reverse FX를 넣어 전환감을 만든다",
        "",
        "## 믹스 노트",
        "- 보컬 가이드 기준 -14 LUFS 근처의 러프 마스터를 목표로 설정",
        "- 리버브는 Verse에서 짧게, Chorus에서 10-15% 넓게 확장",
        "- 데모 export 전 클리핑 피크를 -1.5 dBTP 아래로 유지",
    ])


def _fallback_result(
    prompt: str,
    genre: str,
    mood: str,
    duration_sec: int,
    reason: str,
    error_message: str | None = None,
) -> CompositionResult:
    return CompositionResult(
        status="succeeded",
        provider="fallback",
        model="arrangement-rule-v1",
        output_text=_fallback_plan(prompt, genre, mood, duration_sec),
        message="Composition blueprint generated",
        fallback_reason=reason,
        error_message=error_message,
        metadata={
            "prompt": prompt,
            "genre": genre,
            "mood": mood,
            "duration_sec": duration_sec,
            "fallback_reason": reason,
        },
    )


def _format_openai_plan(data: dict[str, Any]) -> str:
    title = str(data.get("title") or "Demo Blueprint").strip()
    summary = str(data.get("summary") or "").strip()
    tempo_bpm = data.get("tempo_bpm")
    key = str(data.get("key") or "").strip()
    chords = data.get("chord_progression") or []
    sections = data.get("sections") or []
    melody = data.get("melody_guide") or []
    sound_design = data.get("sound_design") or []
    mix_notes = data.get("mix_notes") or []

    lines = [
        "## 요약",
        f"- 제목: {title}",
        f"- 콘셉트: {summary}",
        f"- 권장 템포/키: {tempo_bpm} BPM, {key}",
        "",
        "## 편곡 타임라인",
    ]
    for section in sections:
        if isinstance(section, dict):
            timecode = section.get("timecode") or section.get("time") or "구간"
            description = section.get("description") or section.get("role") or ""
            lines.append(f"- {timecode}: {description}")
    lines.extend(["", "## 코드 진행"])
    for chord in chords:
        lines.append(f"- {chord}")
    lines.extend(["", "## 멜로디 가이드"])
    for item in melody:
        lines.append(f"- {item}")
    lines.extend(["", "## 사운드 디자인"])
    for item in sound_design:
        lines.append(f"- {item}")
    lines.extend(["", "## 믹스 노트"])
    for item in mix_notes:
        lines.append(f"- {item}")
    return "\n".join(lines).strip()


def _parse_openai_response(raw: str) -> str:
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("OpenAI response must be a JSON object")
    plan = _format_openai_plan(data)
    issue = _quality_issue(plan)
    if issue:
        raise ValueError(issue)
    return plan


def _quality_issue(plan: str) -> str | None:
    if len(plan) < MIN_PLAN_CHARS:
        return "Generated composition plan is too short"
    if len(plan) > MAX_PLAN_CHARS:
        return "Generated composition plan is too long"
    if not all(section in plan for section in REQUIRED_SECTIONS):
        return "Generated composition plan is missing required sections"
    if "http://" in plan or "https://" in plan:
        return "Generated composition plan includes a URL"
    return None


def _metadata(prompt: str, genre: str, mood: str, duration_sec: int) -> dict[str, Any]:
    return {
        "prompt": prompt,
        "genre": genre,
        "mood": mood,
        "duration_sec": duration_sec,
        "quality_rules": {
            "min_chars": MIN_PLAN_CHARS,
            "max_chars": MAX_PLAN_CHARS,
            "required_sections": list(REQUIRED_SECTIONS),
        },
        "audio_provider": settings.music_generation_provider,
    }


def generate_demo_track(
    prompt: str,
    genre: str,
    mood: str,
    duration_sec: int,
) -> dict:
    if not settings.openai_api_key:
        return _fallback_result(
            prompt,
            genre,
            mood,
            duration_sec,
            "OPENAI_API_KEY is not configured",
        ).__dict__

    try:
        client = _create_openai_client(settings.openai_api_key)
        response = client.responses.create(
            model=settings.composition_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are a Korean demo producer. Create an original composition blueprint for a music platform. "
                        "Do not imitate existing songs or artists. Return JSON only with title, summary, tempo_bpm, key, "
                        "sections, chord_progression, melody_guide, sound_design, and mix_notes."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Prompt or lyrics:\n{prompt}\n\n"
                        f"Genre: {genre}\nMood: {mood}\nDuration seconds: {duration_sec}\n"
                        "Make it practical enough for a producer to build a first demo."
                    ),
                },
            ],
            text={"format": {"type": "json_object"}},
            metadata=_metadata(prompt, genre, mood, duration_sec),
        )
        plan = _parse_openai_response(response.output_text)
        return CompositionResult(
            status="succeeded",
            provider="openai",
            model=settings.composition_model,
            output_text=plan,
            message="Composition blueprint generated",
            metadata=_metadata(prompt, genre, mood, duration_sec),
        ).__dict__
    except Exception as exc:
        logger.exception("OpenAI composition generation failed")
        return _fallback_result(
            prompt,
            genre,
            mood,
            duration_sec,
            "OpenAI composition generation failed",
            str(exc)[:500],
        ).__dict__
