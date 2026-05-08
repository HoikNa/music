"""Redis-backed abuse signals for submission/ranking protection."""
import hashlib
import logging
import uuid
from dataclasses import dataclass

from fastapi import Request

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class AbuseDecision:
    risk_score: float
    is_ranking_excluded: bool
    flags: dict[str, object]


def _redis():
    from redis import Redis

    try:
        return Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=0.2,
            socket_timeout=0.2,
        )
    except Exception:
        logger.exception("Failed to create Redis client for abuse detection")
        return None


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:24]


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def evaluate_submission_abuse(request: Request, user_id: uuid.UUID, audio_url: str) -> AbuseDecision:
    client = _redis()
    if client is None:
        return AbuseDecision(
            risk_score=0.0,
            is_ranking_excluded=False,
            flags={"status": "skipped", "reason": "redis_unavailable"},
        )

    ip = _client_ip(request)
    device_id = request.headers.get("x-device-id") or request.headers.get("x-client-device-id") or "unknown"
    keys = {
        "user": (f"abuse:submission:user:{user_id}", settings.abuse_user_submissions_per_hour),
        "ip": (f"abuse:submission:ip:{_hash(ip)}", settings.abuse_ip_submissions_per_hour),
        "device": (f"abuse:submission:device:{_hash(device_id)}", settings.abuse_device_submissions_per_hour),
        "audio": (f"abuse:submission:audio:{_hash(audio_url)}", settings.abuse_audio_submissions_per_hour),
    }

    counts: dict[str, int] = {}
    exceeded: list[str] = []
    try:
        pipe = client.pipeline()
        for key, _threshold in keys.values():
            pipe.incr(key)
            pipe.expire(key, 3600)
        results = pipe.execute()
    except Exception:
        logger.exception("Failed to evaluate Redis abuse counters")
        return AbuseDecision(
            risk_score=0.0,
            is_ranking_excluded=False,
            flags={"status": "skipped", "reason": "redis_error"},
        )

    for idx, (scope, (_key, threshold)) in enumerate(keys.items()):
        count = int(results[idx * 2])
        counts[scope] = count
        if count > threshold:
            exceeded.append(scope)

    max_ratio = max(
        (counts[scope] / max(threshold, 1) for scope, (_key, threshold) in keys.items()),
        default=0.0,
    )
    risk_score = round(min(1.0, max_ratio), 2)
    is_ranking_excluded = bool(exceeded)
    return AbuseDecision(
        risk_score=risk_score,
        is_ranking_excluded=is_ranking_excluded,
        flags={
            "status": "evaluated",
            "window_sec": 3600,
            "counts": counts,
            "exceeded": exceeded,
            "requires_captcha": is_ranking_excluded,
        },
    )
