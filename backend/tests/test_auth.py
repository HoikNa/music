def test_register_success(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "new@example.com",
        "password": "Test1234!",
        "nickname": "newuser",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client, registered_user):
    res = client.post("/api/v1/auth/register", json={
        "email": "user@example.com",
        "password": "Test1234!",
        "nickname": "other",
    })
    assert res.status_code == 409


def test_register_duplicate_nickname(client, registered_user):
    res = client.post("/api/v1/auth/register", json={
        "email": "other@example.com",
        "password": "Test1234!",
        "nickname": "testuser",
    })
    assert res.status_code == 409


def test_login_success(client, registered_user):
    res = client.post("/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "Test1234!",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client, registered_user):
    res = client.post("/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401


def test_login_unknown_email(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com",
        "password": "Test1234!",
    })
    assert res.status_code == 401


def test_me_authenticated(client, auth_headers):
    res = client.get("/api/v1/users/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "user@example.com"
    assert data["nickname"] == "testuser"
    assert "credit_balance" in data


def test_me_unauthenticated(client):
    res = client.get("/api/v1/users/me")
    assert res.status_code == 401


def test_logout(client, auth_headers):
    res = client.post("/api/v1/auth/logout", headers=auth_headers)
    assert res.status_code == 200
