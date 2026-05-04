import uuid
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.credit import Credit, CreditTransaction
from app.models.user import User
from app.services.credit_service import get_or_create_credit

router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("/me")
def get_my_credits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    credit = get_or_create_credit(db, current_user.id)
    return {"balance": credit.balance}


@router.get("/me/transactions")
def get_my_transactions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(CreditTransaction)
        .where(CreditTransaction.user_id == current_user.id)
        .order_by(CreditTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return db.exec(stmt).all()
