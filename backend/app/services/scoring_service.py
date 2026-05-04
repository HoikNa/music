import uuid
from typing import Any
from sqlmodel import Session, select

from app.models.score import BaseScore, PersonaScore
from app.models.persona import PersonaWeight, PersonaDimension


DIMENSION_FIELD_MAP: dict[PersonaDimension, str] = {
    PersonaDimension.pitch: "pitch_score",
    PersonaDimension.rhythm: "rhythm_score",
    PersonaDimension.range: "range_score",
    PersonaDimension.dynamic: "dynamic_score",
    PersonaDimension.articulation: "articulation_score",
}


def compute_persona_score(
    db: Session,
    base_score: BaseScore,
    persona_id: uuid.UUID,
) -> PersonaScore:
    weights = db.exec(
        select(PersonaWeight).where(PersonaWeight.persona_id == persona_id)
    ).all()

    breakdown: dict[str, Any] = {}
    total = 0.0

    for w in weights:
        field = DIMENSION_FIELD_MAP[w.dimension]
        raw = getattr(base_score, field, 0.0)
        weighted = raw * w.multiplier

        if w.bonus_threshold and raw >= w.bonus_threshold:
            weighted *= 1.1  # 10% bonus for exceeding threshold

        breakdown[w.dimension.value] = {
            "raw": raw,
            "multiplier": w.multiplier,
            "weighted": round(weighted, 2),
        }
        total += weighted

    persona_score = PersonaScore(
        submission_id=base_score.submission_id,
        persona_id=persona_id,
        base_score_id=base_score.id,
        persona_score=round(total, 2),
        weighted_breakdown=breakdown,
    )
    db.add(persona_score)
    db.commit()
    db.refresh(persona_score)
    return persona_score
