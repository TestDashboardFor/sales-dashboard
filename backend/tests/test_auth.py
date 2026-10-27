CREDS = {"username": "alice", "password": "secret123"}


def test_register_sets_cookie_and_returns_user(client):
    r = client.post("/auth/register", json=CREDS)
    assert r.status_code == 201
    assert r.json()["username"] == "alice"
    assert "password" not in r.text
    assert "httponly" in r.headers["set-cookie"].lower()


def test_register_duplicate_username(client):
    client.post("/auth/register", json=CREDS)
    r = client.post("/auth/register", json=CREDS)
    assert r.status_code == 409


def test_register_validates_input(client):
    assert client.post("/auth/register", json={"username": "al", "password": "secret123"}).status_code == 422
    assert client.post("/auth/register", json={"username": "alice", "password": "short"}).status_code == 422


def test_login_success_and_me(client):
    client.post("/auth/register", json=CREDS)
    client.cookies.clear()
    assert client.get("/auth/me").status_code == 401

    assert client.post("/auth/login", json=CREDS).status_code == 200
    me = client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "alice"


def test_login_wrong_password(client):
    client.post("/auth/register", json=CREDS)
    client.cookies.clear()
    r = client.post("/auth/login", json={**CREDS, "password": "wrong-password"})
    assert r.status_code == 401


def test_login_unknown_user(client):
    r = client.post("/auth/login", json=CREDS)
    assert r.status_code == 401


def test_logout_clears_session(client):
    client.post("/auth/register", json=CREDS)
    assert client.get("/auth/me").status_code == 200
    assert client.post("/auth/logout").status_code == 204
    assert client.get("/auth/me").status_code == 401


def test_me_rejects_tampered_token(client):
    client.cookies.set("access_token", "not-a-jwt")
    assert client.get("/auth/me").status_code == 401
