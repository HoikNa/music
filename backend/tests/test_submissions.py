from unittest.mock import patch
import uuid

import pytest


SUBMISSION_PAYLOAD = {
    "title": "테스트 곡",
    "genre": "발라드",
    "audio_url": "https://bucket.s3.ap-northeast-2.amazonaws.com/audio/test.wav",
    "duration_sec": 180,
    "ranking_mode": "both",
    "persona_ids": [],  # conftest에서 페르소나 없이 테스트 (유효성 검증 전)
}


def _create_persona(client, auth_headers):
    """테스트용 페르소나 DB 직접 삽입 (라우터 없으므로 헬퍼로 처리)."""
    from app.models.persona import Persona
    from app.dependencies.db import get_db
    db = next(client.app.dependency_overrides[get_db]())
    persona = Persona(
        name="테스트페르소나",
        display_name="테스트 페르소나",
        genre="발라드",
        is_active=True,
        sort_order=0,
    )
    db.add(persona)
    db.commit()
    db.refresh(persona)
    return str(persona.id)


def test_list_submissions_empty(client, auth_headers):
    res = client.get("/api/v1/submissions", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["has_more"] is False


def test_list_submissions_unauthenticated(client):
    res = client.get("/api/v1/submissions")
    assert res.status_code == 401


@patch("app.routers.submissions.run_scoring")
def test_create_submission(mock_scoring, client, auth_headers):
    persona_id = _create_persona(client, auth_headers)
    payload = {**SUBMISSION_PAYLOAD, "persona_ids": [persona_id]}

    res = client.post("/api/v1/submissions", json=payload, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "테스트 곡"
    assert data["genre"] == "발라드"
    assert data["status"] == "pending"
    assert "id" in data
    mock_scoring.assert_called_once()


@patch("app.routers.submissions.run_scoring")
def test_get_submission(mock_scoring, client, auth_headers):
    persona_id = _create_persona(client, auth_headers)
    create_res = client.post(
        "/api/v1/submissions",
        json={**SUBMISSION_PAYLOAD, "persona_ids": [persona_id]},
        headers=auth_headers,
    )
    submission_id = create_res.json()["id"]

    res = client.get(f"/api/v1/submissions/{submission_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == submission_id


@patch("app.routers.submissions.run_scoring")
def test_create_submission_invalid_persona(mock_scoring, client, auth_headers):
    payload = {**SUBMISSION_PAYLOAD, "persona_ids": [str(uuid.uuid4())]}
    res = client.post("/api/v1/submissions", json=payload, headers=auth_headers)
    assert res.status_code == 400


@patch("app.routers.submissions.run_scoring")
def test_get_submission_other_user_forbidden(mock_scoring, client, auth_headers):
    persona_id = _create_persona(client, auth_headers)
    create_res = client.post(
        "/api/v1/submissions",
        json={**SUBMISSION_PAYLOAD, "persona_ids": [persona_id]},
        headers=auth_headers,
    )
    submission_id = create_res.json()["id"]

    # 다른 유저로 조회
    other = client.post("/api/v1/auth/register", json={
        "email": "other@example.com", "password": "Test1234!", "nickname": "other",
    })
    other_token = other.json()["access_token"]
    res = client.get(
        f"/api/v1/submissions/{submission_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert res.status_code == 403
