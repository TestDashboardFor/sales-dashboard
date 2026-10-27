from datetime import date
from decimal import Decimal


def seed(make_order):
    make_order(order_id="A-1", order_date=date(2016, 1, 10), region="West", category="Furniture",
               sales=Decimal("100"), profit=Decimal("20"), quantity=2)
    make_order(order_id="A-1", order_date=date(2016, 1, 10), region="West", category="Technology",
               sales=Decimal("300"), profit=Decimal("-10"), quantity=1)
    make_order(order_id="A-2", order_date=date(2016, 2, 5), region="East", category="Furniture",
               sales=Decimal("200"), profit=Decimal("50"), quantity=4)


def test_summary(auth_client, make_order):
    seed(make_order)
    s = auth_client.get("/stats/summary").json()
    assert s["total_sales"] == 600
    assert s["total_profit"] == 60
    assert s["total_quantity"] == 7
    assert s["orders"] == 2
    assert s["profit_margin"] == 0.1


def test_summary_empty(auth_client):
    s = auth_client.get("/stats/summary").json()
    assert s["total_sales"] == 0
    assert s["profit_margin"] == 0


def test_summary_respects_filters(auth_client, make_order):
    seed(make_order)
    s = auth_client.get("/stats/summary", params={"region": "West"}).json()
    assert s["total_sales"] == 400
    assert s["orders"] == 1


def test_timeseries_by_month(auth_client, make_order):
    seed(make_order)
    points = auth_client.get("/stats/timeseries").json()
    assert [p["period"] for p in points] == ["2016-01-01", "2016-02-01"]
    assert [p["sales"] for p in points] == [400, 200]


def test_timeseries_by_year(auth_client, make_order):
    seed(make_order)
    points = auth_client.get("/stats/timeseries", params={"granularity": "year"}).json()
    assert len(points) == 1
    assert points[0]["sales"] == 600


def test_breakdown_sorted_by_sales(auth_client, make_order):
    seed(make_order)
    items = auth_client.get("/stats/breakdown", params={"by": "region"}).json()
    assert [(i["label"], i["sales"], i["orders"]) for i in items] == [("West", 400, 1), ("East", 200, 1)]


def test_breakdown_rejects_unknown_dimension(auth_client):
    assert auth_client.get("/stats/breakdown", params={"by": "password"}).status_code == 422


def test_options(auth_client, make_order):
    seed(make_order)
    o = auth_client.get("/stats/options").json()
    assert o["regions"] == ["East", "West"]
    assert o["categories"] == ["Furniture", "Technology"]
    assert o["date_min"] == "2016-01-10"
    assert o["date_max"] == "2016-02-05"
