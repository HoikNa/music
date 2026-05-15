import json
import uuid

from app.dependencies.db import get_db
from app.models.generated_asset import GeneratedAsset, GeneratedAssetStatus, GeneratedAssetType
from app.models.submission import RankingMode, Submission, SubmissionStatus


def _db_from_client(client):
    return next(client.app.dependency_overrides[get_db]())


def test_ai_assets_returns_current_users_generated_assets(client, auth_headers):
    create_res = client.post(
        "/api/v1/ai/lyrics",
        json={
            "theme": "한강 새벽 테스트",
            "genre": "K-Indie",
            "mood": "warm",
            "keywords": ["한강"],
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201

    res = client.get("/api/v1/ai/assets", headers=auth_headers)
    assert res.status_code == 200

    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["asset_type"] == "lyrics"
    assert items[0]["status"] == "succeeded"
    assert items[0]["prompt"] == "한강 새벽 테스트 / Folk / warm"
    assert items[0]["input_data"]["theme"] == "한강 새벽 테스트"


def test_ai_assets_can_filter_by_asset_type(client, auth_headers, monkeypatch):
    import app.routers.ai as ai_router

    monkeypatch.setattr(ai_router, "_enqueue_mastering", lambda asset_id, background_tasks: None)

    lyrics_res = client.post(
        "/api/v1/ai/lyrics",
        json={"theme": "필터 테스트", "genre": "Pop", "mood": "bright"},
        headers=auth_headers,
    )
    assert lyrics_res.status_code == 201

    mastering_res = client.post(
        "/api/v1/ai/mastering",
        json={"audio_url": "https://example.com/source.wav", "target_lufs": -14},
        headers=auth_headers,
    )
    assert mastering_res.status_code == 202

    res = client.get("/api/v1/ai/assets?asset_type=mastering", headers=auth_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["asset_type"] == "mastering"


def test_lyrics_asset_records_fallback_reason_when_openai_is_not_configured(client, auth_headers, monkeypatch):
    from app.services import lyrics_service

    monkeypatch.setattr(lyrics_service.settings, "openai_api_key", None)

    res = client.post(
        "/api/v1/ai/lyrics",
        json={"theme": "fallback", "genre": "Pop", "mood": "warm"},
        headers=auth_headers,
    )
    assert res.status_code == 201

    asset = res.json()
    assert asset["provider"] == "fallback"
    assert asset["model"] == "rule-v1"
    assert asset["error_message"] is None
    assert asset["input_data"]["metadata"]["fallback_reason"] == "OPENAI_API_KEY is not configured"


def test_lyrics_asset_records_provider_error_when_openai_fails(client, auth_headers, monkeypatch):
    from app.services import lyrics_service

    class BrokenResponses:
        def create(self, **kwargs):
            raise RuntimeError("provider timeout")

    class BrokenClient:
        responses = BrokenResponses()

    monkeypatch.setattr(lyrics_service.settings, "openai_api_key", "test-key")
    monkeypatch.setattr(lyrics_service, "_create_openai_client", lambda api_key: BrokenClient())

    res = client.post(
        "/api/v1/ai/lyrics",
        json={"theme": "failure", "genre": "Pop", "mood": "warm"},
        headers=auth_headers,
    )
    assert res.status_code == 201

    asset = res.json()
    assert asset["provider"] == "fallback"
    assert asset["error_message"] == "provider timeout"
    assert asset["input_data"]["metadata"]["fallback_reason"] == "OpenAI lyrics generation failed"


def test_lyrics_asset_accepts_valid_openai_response(client, auth_headers, monkeypatch):
    from app.services import lyrics_service

    valid_lyrics = "\n".join([
        "[Verse 1]",
        "새벽빛 아래 너를 불러",
        "조용한 마음이 파도처럼 번져",
        "익숙한 길 끝에 멈춰 서면",
        "우리의 계절이 다시 노래해",
        "",
        "[Chorus]",
        "너에게 닿을게 이 밤이 지나도",
        "흔들린 숨결을 멜로디에 실어",
        "다시 피어나는 작은 고백처럼",
        "오늘의 우리를 오래 안을게",
    ])

    class Response:
        output_text = json.dumps({"lyrics": valid_lyrics})

    class Responses:
        def create(self, **kwargs):
            assert kwargs["metadata"]["quality_rules"]["min_lines"] == 6
            return Response()

    class Client:
        responses = Responses()

    monkeypatch.setattr(lyrics_service.settings, "openai_api_key", "test-key")
    monkeypatch.setattr(lyrics_service, "_create_openai_client", lambda api_key: Client())

    res = client.post(
        "/api/v1/ai/lyrics",
        json={"theme": "새벽 고백", "genre": "Ballad", "mood": "warm", "keywords": ["새벽"]},
        headers=auth_headers,
    )
    assert res.status_code == 201

    asset = res.json()
    assert asset["provider"] == "openai"
    assert asset["error_message"] is None
    assert "metadata" not in asset["input_data"]
    assert "[Chorus]" in asset["output_text"]


def test_lyrics_asset_falls_back_when_openai_response_fails_quality_check(client, auth_headers, monkeypatch):
    from app.services import lyrics_service

    class Response:
        output_text = '{"lyrics":"짧은 가사"}'

    class Responses:
        def create(self, **kwargs):
            return Response()

    class Client:
        responses = Responses()

    monkeypatch.setattr(lyrics_service.settings, "openai_api_key", "test-key")
    monkeypatch.setattr(lyrics_service, "_create_openai_client", lambda api_key: Client())

    res = client.post(
        "/api/v1/ai/lyrics",
        json={"theme": "품질 검사", "genre": "Pop", "mood": "warm"},
        headers=auth_headers,
    )
    assert res.status_code == 201

    asset = res.json()
    assert asset["provider"] == "fallback"
    assert asset["input_data"]["metadata"]["fallback_reason"] == "Generated lyrics are too short"


def test_lyrics_rejects_unsafe_prompt_before_provider_call(client, auth_headers, monkeypatch):
    from app.services import lyrics_service

    called = False

    def fake_client(api_key):
        nonlocal called
        called = True
        raise AssertionError("provider should not be called")

    monkeypatch.setattr(lyrics_service.settings, "openai_api_key", "test-key")
    monkeypatch.setattr(lyrics_service, "_create_openai_client", fake_client)

    res = client.post(
        "/api/v1/ai/lyrics",
        json={"theme": "폭탄 제조 방법을 노래로", "genre": "Pop", "mood": "dark"},
        headers=auth_headers,
    )
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "UNSAFE_LYRICS_PROMPT"
    assert called is False


def test_lyrics_rejects_overlong_keyword(client, auth_headers):
    res = client.post(
        "/api/v1/ai/lyrics",
        json={"theme": "키워드 검사", "genre": "Pop", "mood": "warm", "keywords": ["x" * 31]},
        headers=auth_headers,
    )
    assert res.status_code == 422


def test_ai_assets_requires_auth(client):
    res = client.get("/api/v1/ai/assets")
    assert res.status_code == 401


def test_compose_creates_fallback_blueprint_when_openai_is_not_configured(client, auth_headers, monkeypatch):
    from app.services import music_generation_service

    monkeypatch.setattr(music_generation_service.settings, "openai_api_key", None)

    res = client.post(
        "/api/v1/ai/compose",
        json={
            "prompt": "새벽 도시의 미니멀한 데모",
            "genre": "City Pop",
            "mood": "neon, calm",
            "duration_sec": 45,
        },
        headers=auth_headers,
    )
    assert res.status_code == 201

    asset = res.json()
    assert asset["asset_type"] == "composition"
    assert asset["status"] == "succeeded"
    assert asset["provider"] == "fallback"
    assert asset["model"] == "arrangement-rule-v1"
    assert "## 편곡 타임라인" in asset["output_text"]
    assert "## 믹스 노트" in asset["output_text"]
    assert asset["output_url"] is None
    assert asset["error_message"] is None
    assert asset["input_data"]["metadata"]["fallback_reason"] == "OPENAI_API_KEY is not configured"


def test_compose_accepts_valid_openai_blueprint(client, auth_headers, monkeypatch):
    from app.services import music_generation_service

    class Response:
        output_text = json.dumps({
            "title": "River Night Demo",
            "summary": "잔잔한 피아노에서 시작해 후렴에서 넓어지는 보컬 팝 데모",
            "tempo_bpm": 94,
            "key": "C major",
            "sections": [
                {"timecode": "0:00-0:08", "description": "Intro: piano motif"},
                {"timecode": "0:08-0:28", "description": "Verse: close vocal"},
                {"timecode": "0:28-0:45", "description": "Chorus: full drums"},
            ],
            "chord_progression": ["I - V - vi - IV", "vi - IV - I - V"],
            "melody_guide": ["Verse는 3도 안에서 시작", "Chorus는 반복 훅 사용"],
            "sound_design": ["Warm piano", "Soft pad", "Tight kick"],
            "mix_notes": ["Keep peak under -1.5 dBTP", "Center vocal"],
        })

    class Responses:
        def create(self, **kwargs):
            assert kwargs["metadata"]["audio_provider"] == music_generation_service.settings.music_generation_provider
            return Response()

    class Client:
        responses = Responses()

    monkeypatch.setattr(music_generation_service.settings, "openai_api_key", "test-key")
    monkeypatch.setattr(music_generation_service, "_create_openai_client", lambda api_key: Client())

    res = client.post(
        "/api/v1/ai/compose",
        json={
            "prompt": "새벽 도시의 미니멀한 데모",
            "genre": "Pop",
            "mood": "neon, calm",
            "duration_sec": 45,
        },
        headers=auth_headers,
    )
    assert res.status_code == 201

    asset = res.json()
    assert asset["status"] == "succeeded"
    assert asset["provider"] == "openai"
    assert asset["model"] == music_generation_service.settings.composition_model
    assert asset["error_message"] is None
    assert "River Night Demo" in asset["output_text"]
    assert "metadata" in asset["input_data"]


def test_mastering_queues_generated_asset_without_running_inline(client, auth_headers, monkeypatch):
    import app.routers.ai as ai_router

    enqueued: list[str] = []
    monkeypatch.setattr(ai_router, "_enqueue_mastering", lambda asset_id, background_tasks: enqueued.append(str(asset_id)))

    res = client.post(
        "/api/v1/ai/mastering",
        json={
            "audio_url": "https://example.com/source.wav",
            "target_lufs": -14,
        },
        headers=auth_headers,
    )
    assert res.status_code == 202

    asset = res.json()
    assert asset["asset_type"] == "mastering"
    assert asset["status"] == "queued"
    assert asset["provider"] == "ffmpeg"
    assert asset["output_url"] is None
    assert asset["input_data"]["audio_url"] == "https://example.com/source.wav"
    assert enqueued == [asset["id"]]


def test_mastering_rejects_other_users_submission(client, auth_headers, registered_user, monkeypatch):
    import app.routers.ai as ai_router

    monkeypatch.setattr(ai_router, "_enqueue_mastering", lambda asset_id, background_tasks: None)

    other_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "other@example.com",
            "password": "Test1234!",
            "nickname": "otheruser",
        },
    )
    assert other_res.status_code == 201
    other_token = other_res.json()["access_token"]
    other_me = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {other_token}"})
    other_user_id = other_me.json()["id"]

    db = _db_from_client(client)
    submission = Submission(
        user_id=uuid.UUID(other_user_id),
        title="다른 사람 음원",
        genre="Pop",
        audio_url="https://example.com/other.wav",
        duration_sec=120,
        ranking_mode=RankingMode.ranking,
        status=SubmissionStatus.scored,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    res = client.post(
        "/api/v1/ai/mastering",
        json={"submission_id": str(submission.id), "target_lufs": -14},
        headers=auth_headers,
    )
    assert res.status_code == 404


def test_process_mastering_asset_updates_asset_to_succeeded(client, registered_user, monkeypatch):
    from app.routers.ai import process_mastering_asset
    from app.services import mastering_service

    def fake_master_audio(audio_url, user_id, target_lufs=None):
        return {
            "status": "succeeded",
            "provider": "ffmpeg",
            "audio_url": "https://example.com/mastered.mp3",
            "message": "Mastering completed",
        }

    monkeypatch.setattr(mastering_service, "master_audio", fake_master_audio)

    db = _db_from_client(client)
    asset = GeneratedAsset(
        user_id=uuid.UUID(registered_user["id"]),
        asset_type=GeneratedAssetType.mastering,
        status=GeneratedAssetStatus.queued,
        provider="ffmpeg",
        prompt="target_lufs=-14",
        input_data={"audio_url": "https://example.com/source.wav", "target_lufs": -14},
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    process_mastering_asset(db, asset.id)

    updated = db.get(GeneratedAsset, asset.id)
    assert updated.status == GeneratedAssetStatus.succeeded
    assert updated.output_url == "https://example.com/mastered.mp3"
    assert updated.error_message is None


def test_process_mastering_asset_marks_missing_audio_url_failed(client, registered_user):
    from app.routers.ai import process_mastering_asset

    db = _db_from_client(client)
    asset = GeneratedAsset(
        user_id=uuid.UUID(registered_user["id"]),
        asset_type=GeneratedAssetType.mastering,
        status=GeneratedAssetStatus.queued,
        provider="ffmpeg",
        prompt="target_lufs=-14",
        input_data={"target_lufs": -14},
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    process_mastering_asset(db, asset.id)

    updated = db.get(GeneratedAsset, asset.id)
    assert updated.status == GeneratedAssetStatus.failed
    assert updated.error_message == "audio_url is missing"
