import pytest

from app.config import Settings


@pytest.mark.parametrize(
    "url",
    ["postgres://u:p@host:5432/db", "postgresql://u:p@host:5432/db"],
)
def test_plain_postgres_urls_use_psycopg_driver(url):
    settings = Settings(database_url=url, jwt_secret="x")
    assert settings.database_url == "postgresql+psycopg://u:p@host:5432/db"


def test_explicit_driver_is_left_alone():
    url = "postgresql+psycopg://u:p@host:5432/db"
    assert Settings(database_url=url, jwt_secret="x").database_url == url
