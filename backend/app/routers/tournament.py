import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.dependencies.auth import get_current_admin, get_current_user
from app.dependencies.db import get_db
from app.models.master_score import MasterScore
from app.models.tournament import TournamentTicket
from app.models.user import User

router = APIRouter(prefix="/tournament", tags=["tournament"])


class MasterScoreCreate(BaseModel):
    persona_id: uuid.UUID
    target_score: float
    valid_from: datetime
    valid_until: datetime | None = None


@router.get("/challenges")
def list_challenges(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    challenges = db.exec(
        select(MasterScore)
        .where(
            MasterScore.is_active,
            MasterScore.valid_from <= now,
            (MasterScore.valid_until == None) | (MasterScore.valid_until >= now),  # noqa: E711
        )
        .order_by(MasterScore.valid_from.desc())
    ).all()
    return [
        {
            "id": item.id,
            "persona_id": item.persona_id,
            "target_score": item.target_score,
            "valid_from": item.valid_from,
            "valid_until": item.valid_until,
        }
        for item in challenges
    ]


@router.get("/tickets")
def list_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tickets = db.exec(
        select(TournamentTicket)
        .where(TournamentTicket.user_id == current_user.id)
        .order_by(TournamentTicket.created_at.desc())
    ).all()
    return [
        {
            "id": ticket.id,
            "persona_id": ticket.persona_id,
            "submission_id": ticket.submission_id,
            "status": ticket.status,
            "expires_at": ticket.expires_at,
            "created_at": ticket.created_at,
        }
        for ticket in tickets
    ]


@router.post("/master-scores", status_code=201)
def create_master_score(
    body: MasterScoreCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    active_scores = db.exec(
        select(MasterScore).where(
            MasterScore.persona_id == body.persona_id,
            MasterScore.is_active,
        )
    ).all()
    for score in active_scores:
        score.is_active = False
        db.add(score)

    master_score = MasterScore(
        persona_id=body.persona_id,
        target_score=body.target_score,
        valid_from=body.valid_from,
        valid_until=body.valid_until,
        created_by=current_admin.id,
    )
    db.add(master_score)
    db.commit()
    db.refresh(master_score)
    return master_score
