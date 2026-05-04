import uuid
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.dependencies.db import get_db
from app.helpers.db import fetch_by_id
from app.models.ranking import RankingPeriod, RankingEntry, PeriodStatus

router = APIRouter(prefix="/rankings", tags=["rankings"])


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
