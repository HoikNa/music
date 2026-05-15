import uuid
from datetime import date

from app.dependencies.db import get_db
from app.models.persona import Persona
from app.models.ranking import PeriodStatus, PeriodType, RankingEntry, RankingPeriod
from app.models.submission import RankingMode, Submission, SubmissionStatus


def _db_from_client(client):
    return next(client.app.dependency_overrides[get_db]())


def _seed_ranking_period(db):
    persona = Persona(
        name="랭킹테스트",
        display_name="랭킹 테스트",
        genre="VOVATAR_POP",
        is_active=True,
    )
    db.add(persona)
    db.commit()
    db.refresh(persona)

    period = RankingPeriod(
        persona_id=persona.id,
        period_type=PeriodType.weekly,
        start_date=date(2026, 5, 11),
        end_date=date(2026, 5, 17),
        status=PeriodStatus.active,
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


def _seed_submission(db, user_id: str, title: str, genre: str) -> Submission:
    submission = Submission(
        user_id=uuid.UUID(user_id),
        title=title,
        genre=genre,
        audio_url=f"https://example.com/{title}.wav",
        duration_sec=180,
        status=SubmissionStatus.scored,
        ranking_mode=RankingMode.both,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def test_weekly_ranking_genre_filter_is_applied_before_limit(client, registered_user):
    db = _db_from_client(client)
    period = _seed_ranking_period(db)
    pop_submission = _seed_submission(db, registered_user["id"], "pop", "VOVATAR_POP")
    rock_submission = _seed_submission(db, registered_user["id"], "rock", "VOVATAR_ROCK")

    for rank in range(1, 101):
        db.add(
            RankingEntry(
                period_id=period.id,
                submission_id=pop_submission.id,
                user_id=uuid.UUID(registered_user["id"]),
                rank=rank,
                persona_score=100 - rank,
            )
        )
    db.add(
        RankingEntry(
            period_id=period.id,
            submission_id=rock_submission.id,
            user_id=uuid.UUID(registered_user["id"]),
            rank=101,
            persona_score=72.5,
        )
    )
    db.commit()

    res = client.get("/api/v1/rankings/weekly?genre=VOVATAR_ROCK")

    assert res.status_code == 200
    entries = res.json()["entries"]
    assert len(entries) == 1
    assert entries[0]["rank"] == 101
    assert entries[0]["genre"] == "VOVATAR_ROCK"
    assert entries[0]["genre_label"] == "Rock"

