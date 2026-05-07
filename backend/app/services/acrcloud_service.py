from __future__ import annotations

import base64
import hmac
import os
import tempfile
import time
from dataclasses import dataclass, field
from hashlib import sha1

import boto3
import requests

from app.config import settings


@dataclass
class AudioDetectionResult:
    status: str
    provider: str = "acrcloud"
    score: float | None = None
    reason: str | None = None
    result: dict = field(default_factory=dict)


def _configured() -> bool:
    return bool(
        settings.acrcloud_host
        and settings.acrcloud_access_key
        and settings.acrcloud_access_secret
    )


def _download_from_s3(audio_url: str, dest_path: str) -> None:
    from urllib.parse import urlparse

    parsed = urlparse(audio_url)
    bucket = parsed.netloc.split(".")[0]
    key = parsed.path.lstrip("/")
    boto3.client("s3", region_name=settings.aws_region).download_file(bucket, key, dest_path)


def _identify_audio(audio_url: str) -> dict:
    if not _configured():
        return {"status": {"code": 1000, "msg": "ACRCloud is not configured"}}

    http_method = "POST"
    http_uri = "/v1/identify"
    data_type = "audio"
    signature_version = "1"
    timestamp = str(int(time.time()))
    string_to_sign = "\n".join([
        http_method,
        http_uri,
        settings.acrcloud_access_key or "",
        data_type,
        signature_version,
        timestamp,
    ])
    signature = base64.b64encode(
        hmac.new(
            (settings.acrcloud_access_secret or "").encode("utf-8"),
            string_to_sign.encode("utf-8"),
            digestmod=sha1,
        ).digest()
    ).decode("utf-8")

    suffix = "." + audio_url.rsplit(".", 1)[-1] if "." in audio_url else ".mp3"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, dir="/tmp", delete=False)
    tmp.close()
    try:
        _download_from_s3(audio_url, tmp.name)
        with open(tmp.name, "rb") as sample:
            response = requests.post(
                f"https://{settings.acrcloud_host}{http_uri}",
                data={
                    "access_key": settings.acrcloud_access_key,
                    "sample_bytes": os.path.getsize(tmp.name),
                    "timestamp": timestamp,
                    "signature": signature,
                    "data_type": data_type,
                    "signature_version": signature_version,
                },
                files={"sample": sample},
                timeout=15,
            )
        response.raise_for_status()
        return response.json()
    finally:
        os.unlink(tmp.name)


def check_plagiarism(audio_url: str) -> AudioDetectionResult:
    if not _configured():
        return AudioDetectionResult(status="skipped", reason="ACRCloud is not configured")

    try:
        result = _identify_audio(audio_url)
        music = result.get("metadata", {}).get("music", [])
        top_score = float(music[0].get("score", 0.0)) if music else 0.0
        return AudioDetectionResult(
            status="failed" if music else "passed",
            score=top_score,
            reason="Matched commercial fingerprint" if music else None,
            result=result,
        )
    except Exception as exc:
        return AudioDetectionResult(
            status="error",
            reason=str(exc),
            result={"error_type": exc.__class__.__name__},
        )


def check_ai_generated(audio_url: str) -> AudioDetectionResult:
    if not _configured():
        return AudioDetectionResult(status="skipped", reason="ACRCloud is not configured")

    try:
        result = _identify_audio(audio_url)
        probability = (
            result.get("metadata", {})
            .get("ai_generated", {})
            .get("probability")
        )
        score = float(probability) if probability is not None else None
        failed = score is not None and score >= settings.ai_music_probability_threshold
        return AudioDetectionResult(
            status="failed" if failed else "passed",
            score=score,
            reason="AI-generated music probability exceeded threshold" if failed else None,
            result=result,
        )
    except Exception as exc:
        return AudioDetectionResult(
            status="error",
            reason=str(exc),
            result={"error_type": exc.__class__.__name__},
        )
