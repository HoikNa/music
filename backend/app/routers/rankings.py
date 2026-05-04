import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select

from app.dependencies.auth import get_current_user, get_current_user_optional
from app.dependencies.db import get_db
from app.helpers.db import fetch_by_id
from app.models.ranking import RankingPeriod, RankingEntry, PeriodStatus, PeriodType
from app.models.submission import Submission
from app.models.user import User

router = APIRouter(prefix="/rankings", tags=["rankings"])


def _serialize_entry(entry: RankingEntry, db: Session) -> dict:
    user = db.get(User, entry.user_id)
    submission = db.get(Submission, entry.submission_id)
    return {
        "rank": entry.rank,
        "user_id": str(entry.user_id),
        "nickname": user.nickname if user else "",
        "profile_image_url": user.profile_image_url if user else None,
        "submission_id": str(entry.submission_id),
        "title": submission.title if submission else "",
        "score": entry.persona_score,
        "rank_change": (entry.previous_rank - entry.rank) if entry.previous_rank else 0,
    }


@router.get("/weekly")
def get_weekly_ranking(
    persona_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    stmt = (
        select(RankingPeriod)
        .where(
            RankingPeriod.status == PeriodStatus.active,
            RankingPeriod.period_type == PeriodType.weekly,
        )
        .order_by(RankingPeriod.start_date.desc())
    )
    if persona_id:
        stmt = stmt.where(RankingPeriod.persona_id == persona_id)

    period = db.exec(stmt).first()

    if not period:
        return {
            "period": None,
            "entries": [],
            "my_entry": None,
        }

    entries = db.exec(
        select(RankingEntry)
        .where(RankingEntry.period_id == period.id)
        .order_by(RankingEntry.rank)
        .limit(100)
    ).all()

    serialized = [_serialize_entry(e, db) for e in entries]

    my_entry = None
    if current_user:
        my_row = db.exec(
            select(RankingEntry).where(
                RankingEntry.period_id == period.id,
                RankingEntry.user_id == current_user.id,
            )
        ).first()
        if my_row:
            my_entry = _serialize_entry(my_row, db)

    return {
        "period": {
            "start_at": period.start_date.isoformat(),
            "end_at": period.end_date.isoformat(),
            "status": period.status,
        },
        "entries": serialized,
        "my_entry": my_entry,
    }


@router.get("/periods")
def list_active_periods(
    persona_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(RankingPeriod).where(RankingPeriod.status == PeriodStatus.active)
    if persona_id:
        stmt = stmt.where(RankingPeriod.persona_id == persona_id)
    return db.exec(stmt).all()


@router.get("/periods/{period_id}/entries")
def get_ranking_entries(
    period_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    fetch_by_id(db, RankingPeriod, period_id)
    stmt = (
        select(RankingEntry)
        .where(RankingEntry.period_id == period_id)
        .order_by(RankingEntry.rank)
        .offset(skip)
        .limit(limit)
    )
    return db.exec(stmt).all()
