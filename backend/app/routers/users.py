from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.user import User
from app.services.credit_service import get_or_create_credit

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    credit = get_or_create_credit(db, current_user.id)
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "nickname": current_user.nickname,
        "role": current_user.role,
        "profile_image_url": current_user.profile_image_url,
        "bio": current_user.bio,
        "credit_balance": credit.balance,
        "created_at": current_user.created_at.isoformat(),
    }
