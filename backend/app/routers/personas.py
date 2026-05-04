import uuid
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.dependencies.auth import get_current_user, get_current_admin
from app.dependencies.db import get_db
from app.helpers.db import fetch_by_id, fetch_list
from app.models.persona import Persona, PersonaWeight
from app.models.user import User

router = APIRouter(prefix="/personas", tags=["personas"])


@router.get("/")
def list_personas(db: Session = Depends(get_db)):
    return db.exec(select(Persona).where(Persona.is_active == True).order_by(Persona.sort_order)).all()


@router.get("/{persona_id}")
def get_persona(persona_id: uuid.UUID, db: Session = Depends(get_db)):
    return fetch_by_id(db, Persona, persona_id)


@router.get("/{persona_id}/weights")
def get_persona_weights(persona_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.exec(select(PersonaWeight).where(PersonaWeight.persona_id == persona_id)).all()
