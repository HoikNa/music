import uuid
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.dependencies.db import get_db
from app.helpers.db import fetch_by_id
from app.models.persona import Persona, PersonaWeight

router = APIRouter(prefix="/personas", tags=["personas"])


def _with_weights(persona: Persona, db: Session) -> dict:
    weights = db.exec(select(PersonaWeight).where(PersonaWeight.persona_id == persona.id)).all()
    return {
        "id": str(persona.id),
        "name": persona.name,
        "display_name": persona.display_name,
        "genre": persona.genre,
        "image_url": persona.image_url,
        "description": persona.description,
        "weights": [{"dimension": w.dimension, "multiplier": w.multiplier} for w in weights],
    }


@router.get("")
def list_personas(db: Session = Depends(get_db)):
    personas = db.exec(select(Persona).where(Persona.is_active).order_by(Persona.sort_order)).all()
    return {"items": [_with_weights(p, db) for p in personas]}


@router.get("/{persona_id}")
def get_persona(persona_id: uuid.UUID, db: Session = Depends(get_db)):
    persona = fetch_by_id(db, Persona, persona_id)
    return _with_weights(persona, db)
