from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 60 * 24
    frontend_origin: str = "http://localhost:3000"
    cookie_secure: bool = False


settings = Settings()
