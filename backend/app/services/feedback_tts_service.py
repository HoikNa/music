"""Generate persona feedback audio and store it in S3."""
import logging
import os
import tempfile
import uuid
from datetime import datetime

import boto3
from openai import OpenAI
from sqlmodel import Session, create_engine

from app.config import settings
from app.models.score import Feedback

logger = logging.getLogger(__name__)


def _feedback_script(feedback: Feedback) -> str:
    strengths = " ".join(item["description"] for item in feedback.strengths[:2])
    improvements = " ".join(item["description"] for item in feedback.improvements[:2])
    return f"{feedback.summary} 강점은 {strengths} 개선하면 좋은 점은 {improvements}"


def _upload_audio(path: str, feedback_id: uuid.UUID) -> str:
    key = f"feedback-audio/{feedback_id}.mp3"
    boto3.client("s3", region_name=settings.aws_region).upload_file(
        path,
        settings.s3_bucket,
        key,
        ExtraArgs={"ContentType": "audio/mpeg"},
    )
    return f"https://{settings.s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"


def generate_feedback_audio(db: Session, feedback_id: uuid.UUID) -> None:
    feedback = db.get(Feedback, feedback_id)
    if not feedback or feedback.audio_status == "succeeded":
        return

    if not settings.feedback_tts_enabled:
        feedback.audio_status = "skipped"
        feedback.audio_error = "Feedback TTS is disabled"
        feedback.updated_at = datetime.utcnow()
        db.add(feedback)
        db.commit()
        return

    if not settings.openai_api_key:
        feedback.audio_status = "skipped"
        feedback.audio_error = "OPENAI_API_KEY is not configured"
        feedback.updated_at = datetime.utcnow()
        db.add(feedback)
        db.commit()
        return

    feedback.audio_status = "running"
    feedback.audio_error = None
    feedback.audio_model = settings.feedback_tts_model
    feedback.updated_at = datetime.utcnow()
    db.add(feedback)
    db.commit()

    tmp = tempfile.NamedTemporaryFile(suffix=".mp3", dir="/tmp", delete=False)
    tmp.close()
    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.audio.speech.create(
            model=settings.feedback_tts_model,
            voice=settings.feedback_tts_voice,
            input=_feedback_script(feedback)[:3000],
            response_format="mp3",
            instructions="차분하고 전문적인 보컬 코치처럼 말하되, 특정 가수의 음색을 모방하지 마세요.",
        )
        response.write_to_file(tmp.name)

        feedback = db.get(Feedback, feedback_id)
        if not feedback:
            return
        feedback.audio_url = _upload_audio(tmp.name, feedback_id)
        feedback.audio_status = "succeeded"
        feedback.audio_error = None
        feedback.audio_model = settings.feedback_tts_model
        feedback.audio_generated_at = datetime.utcnow()
        feedback.updated_at = datetime.utcnow()
        db.add(feedback)
        db.commit()
    except Exception as exc:
        logger.exception("Failed to generate feedback TTS for %s", feedback_id)
        feedback = db.get(Feedback, feedback_id)
        if feedback:
            feedback.audio_status = "failed"
            feedback.audio_error = str(exc)[:500]
            feedback.updated_at = datetime.utcnow()
            db.add(feedback)
            db.commit()
    finally:
        try:
            os.unlink(tmp.name)
        except FileNotFoundError:
            pass


def run_feedback_tts(feedback_id: uuid.UUID) -> None:
    engine = create_engine(settings.database_url)
    with Session(engine) as db:
        generate_feedback_audio(db, feedback_id)
