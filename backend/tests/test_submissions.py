from unittest.mock import patch
import uuid


def _submission_payload(user_id: str) -> dict:
    return {
        "title": "테스트 곡",
        "genre": "VOVATAR_POP_BALLARD",
        "audio_url": f"https://vertualowl-audio.s3.ap-northeast-2.amazonaws.com/audio/{user_id}/test.wav",
        "duration_sec": 180,
        "ranking_mode": "both",
        "persona_ids": [],
    }


def _create_persona(client, auth_headers):
    """테스트용 페르소나 DB 직접 삽입 (라우터 없으므로 헬퍼로 처리)."""
    from app.models.persona import Persona
    from app.dependencies.db import get_db
    db = next(client.app.dependency_overrides[get_db]())
    persona = Persona(
        name="테스트페르소나",
        display_name="테스트 페르소나",
        genre="VOVATAR_POP_BALLARD",
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
def test_create_submission(mock_scoring, client, auth_headers, registered_user):
    persona_id = _create_persona(client, auth_headers)
    payload = {**_submission_payload(registered_user["id"]), "persona_ids": [persona_id]}

    res = client.post("/api/v1/submissions", json=payload, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "테스트 곡"
    assert data["genre"] == "VOVATAR_POP_BALLARD"
    assert data["genre_label"] == "Pop / Pop Ballard"
    assert data["status"] == "pending"
    assert "id" in data
    mock_scoring.assert_called_once()


def test_list_music_genres(client, auth_headers):
    res = client.get("/api/v1/submissions/genres", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    codes = {item["code"] for item in data["items"]}
    assert "VOVATAR_POP_BALLARD" in codes
    assert "COVO" in codes


@patch("app.routers.submissions.run_scoring")
def test_create_submission_rejects_unknown_genre(mock_scoring, client, auth_headers, registered_user):
    persona_id = _create_persona(client, auth_headers)
    payload = {
        **_submission_payload(registered_user["id"]),
        "genre": "트로트",
        "persona_ids": [persona_id],
    }

    res = client.post("/api/v1/submissions", json=payload, headers=auth_headers)
    assert res.status_code == 422
    mock_scoring.assert_not_called()


@patch("app.routers.submissions.run_scoring")
def test_get_submission(mock_scoring, client, auth_headers, registered_user):
    persona_id = _create_persona(client, auth_headers)
    create_res = client.post(
        "/api/v1/submissions",
        json={**_submission_payload(registered_user["id"]), "persona_ids": [persona_id]},
        headers=auth_headers,
    )
    submission_id = create_res.json()["id"]

    res = client.get(f"/api/v1/submissions/{submission_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == submission_id


@patch("app.routers.submissions.run_scoring")
def test_get_submission_includes_feedback_audio_fields(mock_scoring, client, auth_headers, registered_user):
    from app.dependencies.db import get_db
    from app.models.score import BaseScore, Feedback, PersonaScore

    persona_id = _create_persona(client, auth_headers)
    create_res = client.post(
        "/api/v1/submissions",
        json={**_submission_payload(registered_user["id"]), "persona_ids": [persona_id]},
        headers=auth_headers,
    )
    submission_id = create_res.json()["id"]

    db = next(client.app.dependency_overrides[get_db]())
    base_score = BaseScore(submission_id=uuid.UUID(submission_id), total_score=17.5)
    db.add(base_score)
    db.commit()
    db.refresh(base_score)
    persona_score = PersonaScore(
        submission_id=uuid.UUID(submission_id),
        persona_id=uuid.UUID(persona_id),
        base_score_id=base_score.id,
        persona_score=88.0,
    )
    db.add(persona_score)
    db.commit()
    db.refresh(persona_score)
    feedback = Feedback(
        persona_score_id=persona_score.id,
        summary="좋은 톤입니다.",
        strengths=[{"timestamp": "0:10", "description": "피치가 안정적입니다"}],
        improvements=[{"timestamp": "0:30", "description": "호흡을 더 길게 가져가세요"}],
        audio_url="https://example.com/feedback.mp3",
        audio_status="succeeded",
        audio_model="gpt-4o-mini-tts",
    )
    db.add(feedback)
    db.commit()

    res = client.get(f"/api/v1/submissions/{submission_id}", headers=auth_headers)
    assert res.status_code == 200
    audio_feedback = res.json()["persona_scores"][0]["feedback"]
    assert audio_feedback["audio_url"] == "https://example.com/feedback.mp3"
    assert audio_feedback["audio_status"] == "succeeded"
    assert audio_feedback["audio_model"] == "gpt-4o-mini-tts"
    assert "audio_error" in audio_feedback
    assert "audio_generated_at" in audio_feedback


@patch("app.routers.submissions.run_scoring")
def test_create_submission_invalid_persona(mock_scoring, client, auth_headers, registered_user):
    payload = {**_submission_payload(registered_user["id"]), "persona_ids": [str(uuid.uuid4())]}
    res = client.post("/api/v1/submissions", json=payload, headers=auth_headers)
    assert res.status_code == 400


@patch("app.routers.submissions.run_scoring")
def test_get_submission_other_user_forbidden(mock_scoring, client, auth_headers, registered_user):
    persona_id = _create_persona(client, auth_headers)
    create_res = client.post(
        "/api/v1/submissions",
        json={**_submission_payload(registered_user["id"]), "persona_ids": [persona_id]},
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
