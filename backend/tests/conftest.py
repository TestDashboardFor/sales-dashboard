from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.db import Base, get_db
from app.main import app
from app.models import Order

test_url = make_url(settings.database_url).set(database="sales_test")


@pytest.fixture(scope="session")
def engine():
    admin = create_engine(
        test_url.set(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    with admin.connect() as conn:
        exists = conn.scalar(text("SELECT 1 FROM pg_database WHERE datname = 'sales_test'"))
        if not exists:
            conn.execute(text("CREATE DATABASE sales_test"))
    admin.dispose()

    engine = create_engine(test_url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(connection, join_transaction_mode="create_savepoint")()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client):
    client.post("/auth/register", json={"username": "tester", "password": "secret123"})
    return client


@pytest.fixture
def make_order(db):
    def factory(**overrides) -> Order:
        values = {
            "order_id": "CA-2016-000001",
            "order_date": date(2016, 1, 15),
            "ship_date": date(2016, 1, 18),
            "ship_mode": "Second Class",
            "customer_name": "Claire Gute",
            "segment": "Consumer",
            "city": "Henderson",
            "state": "Kentucky",
            "region": "South",
            "category": "Furniture",
            "sub_category": "Chairs",
            "product_name": "Office Chair",
            "sales": Decimal("100.00"),
            "quantity": 2,
            "discount": Decimal("0.00"),
            "profit": Decimal("20.00"),
        }
        order = Order(**{**values, **overrides})
        db.add(order)
        db.flush()
        return order

    return factory
