"""Seed initial personas and their weights."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlmodel import Session, select
from app.database import engine
from app.models.persona import Persona, PersonaWeight, PersonaDimension

PERSONAS = [
    {
        "name": "bum_su",
        "display_name": "김범수",
        "genre": "VOVATAR_POP_BALLARD",
        "description": "한국 최고의 발라드 가수. 음정과 감성 표현을 최우선시합니다.",
        "sort_order": 1,
        "weights": [
            {"dimension": PersonaDimension.pitch, "multiplier": 2.0, "bonus_threshold": 90.0},
            {"dimension": PersonaDimension.dynamic, "multiplier": 1.5, "bonus_threshold": None},
            {"dimension": PersonaDimension.rhythm, "multiplier": 1.0, "bonus_threshold": None},
            {"dimension": PersonaDimension.range, "multiplier": 1.2, "bonus_threshold": 85.0},
            {"dimension": PersonaDimension.articulation, "multiplier": 0.8, "bonus_threshold": None},
        ],
    },
    {
        "name": "iu",
        "display_name": "아이유",
        "genre": "VOVATAR_POP",
        "description": "국민 가수. 섬세한 감정 표현과 균형 잡힌 실력을 중시합니다.",
        "sort_order": 2,
        "weights": [
            {"dimension": PersonaDimension.pitch, "multiplier": 1.5, "bonus_threshold": 88.0},
            {"dimension": PersonaDimension.articulation, "multiplier": 1.8, "bonus_threshold": 85.0},
            {"dimension": PersonaDimension.dynamic, "multiplier": 1.3, "bonus_threshold": None},
            {"dimension": PersonaDimension.rhythm, "multiplier": 1.2, "bonus_threshold": None},
            {"dimension": PersonaDimension.range, "multiplier": 1.0, "bonus_threshold": None},
        ],
    },
    {
        "name": "taeyang",
        "display_name": "태양",
        "genre": "VOVATAR_RNB_SOUL",
        "description": "R&B/소울의 거장. 리듬감과 다이나믹을 극도로 중시합니다.",
        "sort_order": 3,
        "weights": [
            {"dimension": PersonaDimension.rhythm, "multiplier": 2.0, "bonus_threshold": 88.0},
            {"dimension": PersonaDimension.dynamic, "multiplier": 1.8, "bonus_threshold": 85.0},
            {"dimension": PersonaDimension.pitch, "multiplier": 1.0, "bonus_threshold": None},
            {"dimension": PersonaDimension.range, "multiplier": 1.0, "bonus_threshold": None},
            {"dimension": PersonaDimension.articulation, "multiplier": 1.0, "bonus_threshold": None},
        ],
    },
    {
        "name": "sunmi",
        "display_name": "선미",
        "genre": "VOVATAR_POP",
        "description": "댄스 팝의 아이콘. 퍼포먼스와 리듬 정확성을 봅니다.",
        "sort_order": 4,
        "weights": [
            {"dimension": PersonaDimension.rhythm, "multiplier": 1.8, "bonus_threshold": 90.0},
            {"dimension": PersonaDimension.articulation, "multiplier": 1.5, "bonus_threshold": None},
            {"dimension": PersonaDimension.dynamic, "multiplier": 1.3, "bonus_threshold": None},
            {"dimension": PersonaDimension.pitch, "multiplier": 1.0, "bonus_threshold": None},
            {"dimension": PersonaDimension.range, "multiplier": 0.8, "bonus_threshold": None},
        ],
    },
]


def seed():
    with Session(engine) as db:
        for p_data in PERSONAS:
            existing = db.exec(select(Persona).where(Persona.name == p_data["name"])).first()
            if existing:
                print(f"  skip: {p_data['name']} (already exists)")
                continue

            weights_data = p_data.pop("weights")
            persona = Persona(**p_data)
            db.add(persona)
            db.flush()

            for w in weights_data:
                db.add(PersonaWeight(persona_id=persona.id, **w))

            db.commit()
            print(f"  created: {persona.display_name}")


if __name__ == "__main__":
    print("Seeding personas...")
    seed()
    print("Done.")
