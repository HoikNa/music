from __future__ import annotations

from dataclasses import dataclass, field

from app.config import settings


@dataclass
class ModerationResult:
    status: str
    provider: str = "openai"
    score: float | None = None
    reason: str | None = None
    result: dict = field(default_factory=dict)


def moderate_text(text: str | None) -> ModerationResult:
    if not text or not text.strip():
        return ModerationResult(status="skipped", reason="No lyrics provided")
    if not settings.openai_api_key:
        return ModerationResult(status="skipped", reason="OPENAI_API_KEY is not configured")

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.moderations.create(
            model=settings.moderation_model,
            input=text,
        )
        item = response.results[0]
        categories = item.categories.model_dump()
        scores = item.category_scores.model_dump()
        max_score = max(scores.values()) if scores else None
        flagged_categories = [key for key, flagged in categories.items() if flagged]
        return ModerationResult(
            status="failed" if item.flagged else "passed",
            score=max_score,
            reason=", ".join(flagged_categories) if flagged_categories else None,
            result={"categories": categories, "category_scores": scores},
        )
    except Exception as exc:
        return ModerationResult(
            status="error",
            reason=str(exc),
            result={"error_type": exc.__class__.__name__},
        )
