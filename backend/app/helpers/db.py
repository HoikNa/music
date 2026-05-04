from typing import Any, Type, TypeVar
from fastapi import HTTPException
from sqlmodel import SQLModel, Session, select

T = TypeVar("T", bound=SQLModel)


def fetch_by_id(session: Session, model: Type[T], id: Any) -> T:
    item = session.get(model, id)
    if not item:
        raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
    return item


def fetch_list(
    session: Session,
    model: Type[T],
    skip: int = 0,
    limit: int = 20,
    **filters: Any,
) -> list[T]:
    stmt = select(model)
    for key, value in filters.items():
        if value is not None:
            stmt = stmt.where(getattr(model, key) == value)
    stmt = stmt.offset(skip).limit(limit)
    return session.exec(stmt).all()


def create_item(session: Session, model: Type[T], data: Any) -> T:
    if isinstance(data, dict):
        item = model(**data)
    else:
        item = model(**data.model_dump())
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def update_item(session: Session, item: T, data: Any) -> T:
    updates = data if isinstance(data, dict) else data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(item, key, value)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def soft_delete(session: Session, item: T) -> None:
    from datetime import datetime
    item.is_deleted = True  # type: ignore[attr-defined]
    item.deleted_at = datetime.utcnow()  # type: ignore[attr-defined]
    session.add(item)
    session.commit()
