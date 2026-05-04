import random
import time
import uuid
from datetime import datetime
from typing import Any

from sqlmodel import Session, select, create_engine

from app.config import settings
from app.models.score import BaseScore, PersonaScore, Feedback
from app.models.persona import PersonaWeight, PersonaDimension
from app.models.submission import Submission, SubmissionPersona, SubmissionStatus


DIMENSION_FIELD_MAP: dict[PersonaDimension, str] = {
    PersonaDimension.pitch: "pitch_score",
    PersonaDimension.rhythm: "rhythm_score",
    PersonaDimension.range: "range_score",
    PersonaDimension.dynamic: "dynamic_score",
    PersonaDimension.articulation: "articulation_score",
}

_STRENGTH_TEMPLATES: dict[str, list[str]] = {
    "pitch": [
        "음정이 안정적으로 유지되어 멜로디 라인이 선명합니다.",
        "고음 처리가 깔끔하고 음색 변화 없이 유지됩니다.",
        "피치 정확도가 높아 감정 전달이 효과적입니다.",
    ],
    "rhythm": [
        "리듬 그루브가 탄탄해 박자 위에서 편안하게 얹힙니다.",
        "싱코페이션을 자연스럽게 소화해 리듬감이 풍부합니다.",
        "템포 변화 구간에서도 흔들림 없이 유지됩니다.",
    ],
    "range": [
        "넓은 음역을 고르게 활용해 다이내믹한 표현이 돋보입니다.",
        "저음과 고음의 연결이 매끄럽습니다.",
        "음역 전환 시 자연스러운 흐름을 유지합니다.",
    ],
    "dynamic": [
        "강약 조절이 섬세해 곡의 드라마틱한 흐름을 잘 살립니다.",
        "클라이맥스와 브리지 사이의 대비가 인상적입니다.",
        "작은 다이내믹 변화도 의도적으로 컨트롤됩니다.",
    ],
    "articulation": [
        "발음이 또렷해 가사 전달력이 우수합니다.",
        "자음 처리가 명확하고 일관성 있게 유지됩니다.",
        "단어 연결이 자연스러워 가독성이 높습니다.",
    ],
}

_IMPROVEMENT_TEMPLATES: dict[str, list[str]] = {
    "pitch": [
        "일부 전환부에서 음정 흔들림이 감지됩니다.",
        "고음 유지 구간 후반부에 피치가 내려가는 경향이 있습니다.",
        "보컬 바이브레이토 폭이 음정 안정성을 낮춥니다.",
    ],
    "rhythm": [
        "후렴구 후반에서 박자가 약간 앞서는 경향이 있습니다.",
        "16분음표 패시지에서 균일성이 떨어집니다.",
        "템포 변화 직후 그루브 회복에 시간이 필요합니다.",
    ],
    "range": [
        "저음 구간에서 발성 지지가 부족해집니다.",
        "최고음 도달 후 음색 변화가 생깁니다.",
        "음역 전환 시 브레이크 포인트가 다소 두드러집니다.",
    ],
    "dynamic": [
        "전반적으로 다이내믹 폭이 좁아 단조롭게 느껴질 수 있습니다.",
        "피아노(p) 구간의 지지가 약해 소리가 흩어집니다.",
        "포르테 이후 급격한 다이내믹 드롭이 어색합니다.",
    ],
    "articulation": [
        "빠른 패시지에서 자음 처리가 불분명해집니다.",
        "모음 연장 구간에서 발음이 무너지는 현상이 있습니다.",
        "특정 자음(ㄹ, ㅈ)의 처리를 더 명확히 할 필요가 있습니다.",
    ],
}


def _pick(templates: list[str]) -> str:
    return random.choice(templates)


def _make_timestamp(idx: int) -> str:
    minutes = (idx * 23 + 12) % 4
    seconds = (idx * 17 + 5) % 60
    return f"{minutes:02d}:{seconds:02d}"


def _generate_feedback(dimension_scores: dict[str, float]) -> dict:
    dims = list(dimension_scores.keys())
    sorted_dims = sorted(dims, key=lambda d: dimension_scores[d], reverse=True)
    top2 = sorted_dims[:2]
    bottom2 = sorted_dims[-2:]

    strengths = [
        {"timestamp": _make_timestamp(i), "description": _pick(_STRENGTH_TEMPLATES[d])}
        for i, d in enumerate(top2)
    ]
    improvements = [
        {"timestamp": _make_timestamp(i + 10), "description": _pick(_IMPROVEMENT_TEMPLATES[d])}
        for i, d in enumerate(bottom2)
    ]

    avg = sum(dimension_scores.values()) / len(dimension_scores)
    if avg >= 17:
        summary = "전체적으로 완성도 높은 퍼포먼스입니다. 음정·리듬·표현 모두 안정적이며 즉시 발표 가능한 수준입니다."
    elif avg >= 14:
        summary = "균형 잡힌 실력을 보여줍니다. 몇 가지 세부 사항을 다듬으면 한 단계 더 성장할 수 있습니다."
    else:
        summary = "기초 역량은 갖추고 있습니다. 지적된 항목을 집중 연습하면 빠른 향상이 기대됩니다."

    return {"summary": summary, "strengths": strengths, "improvements": improvements}


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
            weighted *= 1.1

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


def _mark_rejected(db: Session, submission_id: uuid.UUID, reason: str) -> None:
    submission = db.get(Submission, submission_id)
    if submission and submission.status not in (SubmissionStatus.scored, SubmissionStatus.rejected):
        submission.status = SubmissionStatus.rejected
        submission.reject_reason = reason
        submission.updated_at = datetime.utcnow()
        db.add(submission)
        db.commit()


def run_mock_scoring(submission_id: uuid.UUID) -> None:
    """BackgroundTasks 에서 실행되는 모의 채점 워커."""
    engine = create_engine(settings.database_url)
    with Session(engine) as db:
        submission = db.get(Submission, submission_id)
        if not submission or submission.status != SubmissionStatus.pending:
            return

        try:
            # validating 단계
            submission.status = SubmissionStatus.validating
            submission.updated_at = datetime.utcnow()
            db.add(submission)
            db.commit()
            time.sleep(2)

            # scoring 단계
            submission = db.get(Submission, submission_id)
            submission.status = SubmissionStatus.scoring
            submission.updated_at = datetime.utcnow()
            db.add(submission)
            db.commit()
            time.sleep(3)

            # 이미 base_score가 존재하면 중복 실행 방지 (idempotency)
            existing = db.exec(
                select(BaseScore).where(BaseScore.submission_id == submission_id)
            ).first()
            if existing:
                return

            # base score 생성 (각 차원 12~20점)
            dim_scores = {
                "pitch": round(random.uniform(12, 20), 1),
                "rhythm": round(random.uniform(12, 20), 1),
                "range": round(random.uniform(12, 20), 1),
                "dynamic": round(random.uniform(12, 20), 1),
                "articulation": round(random.uniform(12, 20), 1),
            }
            total = round(sum(dim_scores.values()) / len(dim_scores), 2)

            base_score = BaseScore(
                submission_id=submission_id,
                pitch_score=dim_scores["pitch"],
                rhythm_score=dim_scores["rhythm"],
                range_score=dim_scores["range"],
                dynamic_score=dim_scores["dynamic"],
                articulation_score=dim_scores["articulation"],
                total_score=total,
                processing_sec=5,
            )
            db.add(base_score)
            db.commit()
            db.refresh(base_score)

            # 연결된 persona별 채점 + 피드백
            persona_links = db.exec(
                select(SubmissionPersona).where(SubmissionPersona.submission_id == submission_id)
            ).all()

            for link in persona_links:
                ps = compute_persona_score(db, base_score, link.persona_id)
                feedback_data = _generate_feedback(dim_scores)
                feedback = Feedback(
                    persona_score_id=ps.id,
                    summary=feedback_data["summary"],
                    strengths=feedback_data["strengths"],
                    improvements=feedback_data["improvements"],
                )
                db.add(feedback)
                db.commit()

            # 최종 scored 상태
            submission = db.get(Submission, submission_id)
            submission.status = SubmissionStatus.scored
            submission.updated_at = datetime.utcnow()
            db.add(submission)
            db.commit()

        except Exception:
            db.rollback()
            _mark_rejected(db, submission_id, "채점 중 오류가 발생했습니다. 크레딧이 환불됩니다.")


def recover_stale_submissions() -> None:
    """validating/scoring 상태로 10분 이상 멈춘 submission을 rejected로 전환."""
    from datetime import timedelta
    engine = create_engine(settings.database_url)
    with Session(engine) as db:
        cutoff = datetime.utcnow() - timedelta(minutes=10)
        stale = db.exec(
            select(Submission).where(
                Submission.status.in_([SubmissionStatus.validating, SubmissionStatus.scoring]),
                Submission.updated_at < cutoff,
                ~Submission.is_deleted,
            )
        ).all()
        for submission in stale:
            _mark_rejected(db, submission.id, "채점 시간 초과. 크레딧이 환불됩니다.")
