import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import update as sa_update
from sqlmodel import Session, select

from app.config import settings
from app.models.user import User, AuthProvider
from app.models.refresh_token import RefreshToken

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire, "type": "access"},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(user_id: uuid.UUID, db: Session | None = None) -> str:
    jti = uuid.uuid4().hex
    expire = datetime.utcnow() + timedelta(days=settings.jwt_refresh_expire_days)
    token = jwt.encode(
        {"sub": str(user_id), "exp": expire, "type": "refresh", "jti": jti},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    if db is not None:
        db.add(RefreshToken(jti=jti, user_id=user_id, expires_at=expire))
        db.commit()
    return token


def claim_refresh_token(db: Session, jti: str) -> int:
    """Atomically mark refresh token as revoked. Returns 1 if claimed, 0 if already revoked/missing."""
    result = db.execute(
        sa_update(RefreshToken)
        .where(RefreshToken.jti == jti, RefreshToken.is_revoked.is_(False))
        .values(is_revoked=True)
    )
    db.commit()
    return result.rowcount


def revoke_refresh_token(db: Session, jti: str) -> None:
    record = db.exec(select(RefreshToken).where(RefreshToken.jti == jti)).first()
    if record:
        record.is_revoked = True
        db.add(record)
        db.commit()


def is_refresh_token_revoked(db: Session, jti: str) -> bool:
    record = db.exec(select(RefreshToken).where(RefreshToken.jti == jti)).first()
    if not record:
        return True  # DB에 없으면 미등록 토큰 → 거부
    return record.is_revoked


def register_user(db: Session, email: str, password: str, nickname: str) -> User:
    existing = db.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    nick_taken = db.exec(select(User).where(User.nickname == nickname)).first()
    if nick_taken:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nickname already taken")

    user = User(
        email=email,
        hashed_password=hash_password(password),
        nickname=nickname,
        provider=AuthProvider.email,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.exec(select(User).where(User.email == email)).first()
    if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if user.is_deleted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")
    return user
