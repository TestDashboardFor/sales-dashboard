from datetime import date

NEW_ORDER = {
    "order_id": "US-2024-000001",
    "order_date": "2024-03-01",
    "ship_date": "2024-03-04",
    "ship_mode": "Standard Class",
    "customer_name": "Jane Doe",
    "segment": "Corporate",
    "city": "Austin",
    "state": "Texas",
    "region": "Central",
    "category": "Technology",
    "sub_category": "Phones",
    "product_name": "Smart Phone",
    "sales": 250.5,
    "quantity": 1,
    "discount": 0.1,
    "profit": 40.25,
}


def test_orders_require_auth(client):
    assert client.get("/orders").status_code == 401
    assert client.post("/orders", json=NEW_ORDER).status_code == 401
    assert client.get("/stats/summary").status_code == 401


def test_crud_flow(auth_client):
    created = auth_client.post("/orders", json=NEW_ORDER)
    assert created.status_code == 201
    body = created.json()
    assert body["sales"] == 250.5
    oid = body["id"]

    assert auth_client.get(f"/orders/{oid}").json()["customer_name"] == "Jane Doe"

    patched = auth_client.patch(f"/orders/{oid}", json={"sales": 300, "region": "West"})
    assert patched.status_code == 200
    assert patched.json()["sales"] == 300
    assert patched.json()["region"] == "West"
    assert patched.json()["customer_name"] == "Jane Doe"

    assert auth_client.delete(f"/orders/{oid}").status_code == 204
    assert auth_client.get(f"/orders/{oid}").status_code == 404


def test_create_validation(auth_client):
    assert auth_client.post("/orders", json={**NEW_ORDER, "sales": -1}).status_code == 422
    assert auth_client.post("/orders", json={**NEW_ORDER, "discount": 1.5}).status_code == 422
    assert auth_client.post("/orders", json={**NEW_ORDER, "ship_date": "2024-02-01"}).status_code == 422


def test_patch_rejects_ship_before_order(auth_client):
    oid = auth_client.post("/orders", json=NEW_ORDER).json()["id"]
    r = auth_client.patch(f"/orders/{oid}", json={"ship_date": "2024-01-01"})
    assert r.status_code == 422


def test_list_pagination_and_sorting(auth_client, make_order):
    for i, sales in enumerate([30, 10, 20]):
        make_order(order_id=f"A-{i}", sales=sales)

    page = auth_client.get("/orders", params={"page_size": 2, "sort_by": "sales", "sort_dir": "asc"}).json()
    assert page["total"] == 3
    assert [o["sales"] for o in page["items"]] == [10, 20]

    page2 = auth_client.get("/orders", params={"page": 2, "page_size": 2, "sort_by": "sales", "sort_dir": "asc"}).json()
    assert [o["sales"] for o in page2["items"]] == [30]


def test_list_filters_and_search(auth_client, make_order):
    make_order(order_id="A-1", region="West", category="Technology", product_name="Laptop")
    make_order(order_id="A-2", region="South", category="Furniture", product_name="Desk")
    make_order(order_id="A-3", region="West", category="Furniture", product_name="Chair", order_date=date(2017, 6, 1), ship_date=date(2017, 6, 3))

    def total(**params):
        return auth_client.get("/orders", params=params).json()["total"]

    assert total() == 3
    assert total(region="West") == 2
    assert total(region="West", category="Furniture") == 1
    assert total(date_from="2017-01-01") == 1
    assert total(search="lap") == 1


def test_list_rejects_bad_sort_field(auth_client):
    assert auth_client.get("/orders", params={"sort_by": "password_hash"}).status_code == 422
