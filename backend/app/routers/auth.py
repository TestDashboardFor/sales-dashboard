from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.config import settings
from app.deps import COOKIE_NAME, CurrentUser, DbSession
from app.models import User
from app.schemas.user import Credentials, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def set_auth_cookie(response: Response, user_id: int) -> None:
    response.set_cookie(
        COOKIE_NAME,
        create_access_token(user_id),
        max_age=settings.jwt_expire_minutes * 60,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: Credentials, response: Response, db: DbSession):
    if db.scalar(select(User).where(User.username == data.username)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
    user = User(username=data.username, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    set_auth_cookie(response, user.id)
    return user


@router.post("/login", response_model=UserOut)
def login(data: Credentials, response: Response, db: DbSession):
    user = db.scalar(select(User).where(User.username == data.username))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")
    set_auth_cookie(response, user.id)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user
