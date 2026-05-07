"""채점 파이프라인 — librosa 오디오 분석 + Claude API 피드백."""
import uuid
from datetime import datetime

from sqlmodel import Session, select, create_engine

from app.config import settings
from app.models.score import BaseScore, PersonaScore, Feedback
from app.models.persona import Persona, PersonaWeight, PersonaDimension
from app.models.submission import Submission, SubmissionPersona, SubmissionStatus
from app.models.ranking import RankingEntry, RankingPeriod, PeriodStatus
from app.services import audio_analyzer, feedback_generator, credit_service
from app.models.credit import CreditReason

DIMENSION_FIELD_MAP: dict[PersonaDimension, str] = {
    PersonaDimension.pitch: "pitch_score",
    PersonaDimension.rhythm: "rhythm_score",
    PersonaDimension.range: "range_score",
    PersonaDimension.dynamic: "dynamic_score",
    PersonaDimension.articulation: "articulation_score",
}


def _mark_rejected(db: Session, submission_id: uuid.UUID, reason: str) -> None:
    submission = db.get(Submission, submission_id)
    if submission and submission.status not in (
        SubmissionStatus.scored, SubmissionStatus.rejected
    ):
        submission.status = SubmissionStatus.rejected
        submission.reject_reason = reason
        submission.updated_at = datetime.utcnow()
        db.add(submission)
        credit_service.add_credit(
            db, submission.user_id, 1, CreditReason.refund,
            note=f"채점 실패 환불 (submission {submission_id})",
        )


def _compute_persona_score(
    db: Session,
    base_score: BaseScore,
    persona_id: uuid.UUID,
    dim_scores: dict[str, float],
) -> PersonaScore:
    weights = db.exec(
        select(PersonaWeight).where(PersonaWeight.persona_id == persona_id)
    ).all()

    configured_dims = {w.dimension for w in weights}
    missing = set(DIMENSION_FIELD_MAP) - {d.value for d in configured_dims}
    if missing:
        import logging
        logging.getLogger(__name__).warning(
            "Persona %s missing weights for dimensions: %s", persona_id, missing
        )

    breakdown: dict = {}
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

    ps = PersonaScore(
        submission_id=base_score.submission_id,
        persona_id=persona_id,
        base_score_id=base_score.id,
        persona_score=round(total, 2),
        weighted_breakdown=breakdown,
    )
    db.add(ps)
    db.commit()
    db.refresh(ps)
    return ps


def _fallback_feedback(dim_scores: dict[str, float]) -> dict:
    """Claude API 없을 때 점수 기반 간단 피드백."""
    sorted_dims = sorted(dim_scores, key=lambda d: dim_scores[d], reverse=True)
    dim_ko = {
        "pitch": "음정", "rhythm": "리듬", "range": "음역대",
        "dynamic": "다이내믹", "articulation": "발음",
    }
    top = sorted_dims[:2]
    bottom = sorted_dims[-2:]
    avg = sum(dim_scores.values()) / len(dim_scores)

    if avg >= 17:
        summary = "전체적으로 완성도 높은 퍼포먼스입니다. 음정·리듬·표현 모두 안정적이며 즉시 발표 가능한 수준입니다."
    elif avg >= 14:
        summary = "균형 잡힌 실력을 보여줍니다. 몇 가지 세부 사항을 다듬으면 한 단계 더 성장할 수 있습니다."
    else:
        summary = "기초 역량은 갖추고 있습니다. 지적된 항목을 집중 연습하면 빠른 향상이 기대됩니다."

    strengths = [
        {"timestamp": f"00:{i * 23 + 12:02d}", "description": f"{dim_ko[d]} 부분에서 안정적인 실력을 보여주었습니다."}
        for i, d in enumerate(top)
    ] + [{"timestamp": "01:05", "description": "전체적인 곡 해석력이 돋보입니다."}]

    improvements = [
        {"timestamp": f"00:{i * 17 + 35:02d}", "description": f"{dim_ko[d]} 부분을 더 집중적으로 연습해 보세요."}
        for i, d in enumerate(bottom)
    ] + [{"timestamp": "01:20", "description": "감정 표현의 폭을 더 넓혀보세요."}]

    return {"summary": summary, "strengths": strengths[:3], "improvements": improvements[:3]}


def run_scoring(submission_id: uuid.UUID) -> None:
    """BackgroundTasks에서 실행되는 실제 채점 워커."""
    engine = create_engine(settings.database_url)
    with Session(engine) as db:
        submission = db.get(Submission, submission_id)
        if not submission or submission.status != SubmissionStatus.pending:
            return

        try:
            submission.status = SubmissionStatus.validating
            submission.updated_at = datetime.utcnow()
            db.add(submission)
            db.commit()

            # 중복 실행 방지 — BaseScore가 이미 있으면 이전 실행이 완료한 것
            existing = db.exec(
                select(BaseScore).where(BaseScore.submission_id == submission_id)
            ).first()
            if existing:
                submission = db.get(Submission, submission_id)
                if submission and submission.status != SubmissionStatus.scored:
                    submission.status = SubmissionStatus.scored
                    submission.updated_at = datetime.utcnow()
                    db.add(submission)
                    db.commit()
                return

            submission = db.get(Submission, submission_id)
            submission.status = SubmissionStatus.scoring
            submission.updated_at = datetime.utcnow()
            db.add(submission)
            db.commit()

            # ── 실제 오디오 분석 ──────────────────────────────────────────
            try:
                scores = audio_analyzer.analyze(submission.audio_url)
                processing_sec = int(scores.pop("_processing_sec", 0))
            except Exception as e:
                raise RuntimeError(f"오디오 분석 실패: {e}") from e

            dim_scores = {k: scores[k] for k in ("pitch", "rhythm", "range", "dynamic", "articulation")}
            total = round(sum(dim_scores.values()) / len(dim_scores), 2)

            base_score = BaseScore(
                submission_id=submission_id,
                pitch_score=dim_scores["pitch"],
                rhythm_score=dim_scores["rhythm"],
                range_score=dim_scores["range"],
                dynamic_score=dim_scores["dynamic"],
                articulation_score=dim_scores["articulation"],
                total_score=total,
                processing_sec=processing_sec,
            )
            db.add(base_score)
            db.commit()
            db.refresh(base_score)

            # ── 페르소나별 점수 + 피드백 ──────────────────────────────────
            persona_links = db.exec(
                select(SubmissionPersona).where(SubmissionPersona.submission_id == submission_id)
            ).all()

            for link in persona_links:
                ps = _compute_persona_score(db, base_score, link.persona_id, dim_scores)

                persona = db.get(Persona, link.persona_id)
                persona_name = persona.name if persona else ""

                feedback_data = feedback_generator.generate(
                    persona_name=persona_name,
                    dim_scores=dim_scores,
                    genre=submission.genre,
                    title=submission.title,
                )
                used_fallback = feedback_data is None
                if used_fallback:
                    feedback_data = _fallback_feedback(dim_scores)

                feedback = Feedback(
                    persona_score_id=ps.id,
                    summary=feedback_data["summary"],
                    strengths=feedback_data["strengths"],
                    improvements=feedback_data["improvements"],
                    model_version="fallback-rule-v1" if used_fallback else "claude-opus-4-7",
                )
                db.add(feedback)
                db.commit()

            # ── RankingEntry upsert ───────────────────────────────────────
            _upsert_ranking_entries(db, submission_id)

            submission = db.get(Submission, submission_id)
            submission.status = SubmissionStatus.scored
            submission.updated_at = datetime.utcnow()
            db.add(submission)
            db.commit()

        except Exception:
            db.rollback()
            _mark_rejected(db, submission_id, "채점 중 오류가 발생했습니다. 크레딧이 환불됩니다.")


def _upsert_ranking_entries(db: Session, submission_id: uuid.UUID) -> None:
    """채점 완료 후 각 페르소나의 활성 RankingPeriod에 RankingEntry를 upsert하고 순위를 재계산."""
    submission = db.get(Submission, submission_id)
    if not submission:
        return

    persona_scores = db.exec(
        select(PersonaScore).where(PersonaScore.submission_id == submission_id)
    ).all()

    for ps in persona_scores:
        period = db.exec(
            select(RankingPeriod).where(
                RankingPeriod.persona_id == ps.persona_id,
                RankingPeriod.status == PeriodStatus.active,
            )
        ).first()
        if not period:
            continue

        existing = db.exec(
            select(RankingEntry).where(
                RankingEntry.period_id == period.id,
                RankingEntry.submission_id == submission_id,
            )
        ).first()

        if existing:
            existing.persona_score = ps.persona_score
            existing.updated_at = datetime.utcnow()
            db.add(existing)
        else:
            entry = RankingEntry(
                period_id=period.id,
                submission_id=submission_id,
                user_id=submission.user_id,
                rank=0,
                persona_score=ps.persona_score,
            )
            db.add(entry)

        db.flush()

        # 해당 period 전체 순위 재계산
        all_entries = db.exec(
            select(RankingEntry)
            .where(RankingEntry.period_id == period.id)
            .order_by(RankingEntry.persona_score.desc())  # type: ignore[union-attr]
        ).all()
        for rank, entry in enumerate(all_entries, start=1):
            if entry.rank != rank:
                entry.previous_rank = entry.rank
                entry.rank = rank
                entry.updated_at = datetime.utcnow()
                db.add(entry)

    db.flush()


def recover_stale_submissions() -> None:
    from datetime import timedelta
    engine = create_engine(settings.database_url)
    with Session(engine) as db:
        timeout = settings.stale_submission_timeout_minutes
        cutoff = datetime.utcnow() - timedelta(minutes=timeout)
        stale = db.exec(
            select(Submission).where(
                Submission.status.in_([SubmissionStatus.validating, SubmissionStatus.scoring]),
                Submission.updated_at < cutoff,
                ~Submission.is_deleted,
            )
        ).all()
        for s in stale:
            _mark_rejected(db, s.id, "채점 시간 초과. 크레딧이 환불됩니다.")
