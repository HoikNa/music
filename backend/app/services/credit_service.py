import uuid
from fastapi import HTTPException, status
from sqlalchemy import select as sa_select
from sqlmodel import Session, select

from app.models.credit import Credit, CreditTransaction, CreditReason


def get_or_create_credit(db: Session, user_id: uuid.UUID) -> Credit:
    credit = db.exec(select(Credit).where(Credit.user_id == user_id)).first()
    if not credit:
        credit = Credit(user_id=user_id, balance=10)
        db.add(credit)
        db.flush()
        db.add(
            CreditTransaction(
                user_id=user_id,
                amount=10,
                reason=CreditReason.signup_bonus,
            )
        )
        db.flush()
    elif credit.balance == 0 and not db.exec(
        select(CreditTransaction).where(CreditTransaction.user_id == user_id)
    ).first():
        credit.balance = 10
        db.add(credit)
        db.add(
            CreditTransaction(
                user_id=user_id,
                amount=10,
                reason=CreditReason.signup_bonus,
            )
        )
        db.flush()
    return credit


def deduct_credit(
    db: Session,
    user_id: uuid.UUID,
    amount: int,
    reason: CreditReason,
    submission_id: uuid.UUID | None = None,
    commit: bool = True,
) -> Credit:
    # SELECT FOR UPDATE — 동시 요청에서 음수 잔액 방지
    credit = db.exec(
        sa_select(Credit).where(Credit.user_id == user_id).with_for_update()
    ).first()
    if not credit:
        credit = get_or_create_credit(db, user_id)
        db.flush()

    if credit.balance < amount:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient credits")

    credit.balance -= amount
    db.add(credit)

    tx = CreditTransaction(
        user_id=user_id,
        amount=-amount,
        reason=reason,
        submission_id=submission_id,
    )
    db.add(tx)

    if commit:
        db.commit()
        db.refresh(credit)
    return credit


def add_credit(
    db: Session,
    user_id: uuid.UUID,
    amount: int,
    reason: CreditReason,
    note: str | None = None,
) -> Credit:
    credit = get_or_create_credit(db, user_id)
    credit.balance += amount
    db.add(credit)

    tx = CreditTransaction(user_id=user_id, amount=amount, reason=reason, note=note)
    db.add(tx)
    db.commit()
    db.refresh(credit)
    return credit
