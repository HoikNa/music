import uuid
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.credit import Credit, CreditTransaction
from app.models.user import User
from app.services.credit_service import get_or_create_credit

router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("/balance")
def get_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    credit = get_or_create_credit(db, current_user.id)
    return {"balance": credit.balance}


@router.get("/transactions")
def get_transactions(
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
        .limit(limit + 1)
    )
    rows = db.exec(stmt).all()
    has_more = len(rows) > limit
    items = rows[:limit]

    # balance_after를 역순으로 계산
    credit = get_or_create_credit(db, current_user.id)
    running_balance = credit.balance
    serialized = []
    for tx in items:
        serialized.append({
            "delta": tx.amount,
            "balance_after": running_balance,
            "reason": tx.reason,
            "created_at": tx.created_at.isoformat(),
        })
        running_balance -= tx.amount

    return {
        "items": serialized,
        "has_more": has_more,
        "next_cursor": None,
    }
