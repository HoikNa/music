import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.dependencies.db import get_db
from app.main import app


@pytest.fixture(scope="function")
def db_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def client(db_engine):
    def override_get_db():
        with Session(db_engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


# 테스트용 유저 등록 헬퍼
@pytest.fixture
def registered_user(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "user@example.com",
        "password": "Test1234!",
        "nickname": "testuser",
    })
    assert res.status_code == 201
    token = res.json()["access_token"]
    me = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    user_id = me.json()["id"]
    return {"token": token, "email": "user@example.com", "nickname": "testuser", "id": user_id}


@pytest.fixture
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}
