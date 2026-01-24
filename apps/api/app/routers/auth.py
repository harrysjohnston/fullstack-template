"""Authentication endpoints (register/login/refresh/logout)."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.auth import (
    create_access_token,
    create_refresh_token,
    hash_password,
    require_active_refresh_token,
    verify_password,
)
from app.database import get_session
from app.models import RefreshToken, User, UserCreate, UserRead
from app.schemas import ResponseEnvelope

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token_type: str = "bearer"
    access_token: str
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


@router.post(
    "/register", response_model=ResponseEnvelope[UserRead], status_code=status.HTTP_201_CREATED
)
def register(
    payload: UserCreate, session: Session = Depends(get_session)
) -> ResponseEnvelope[User]:
    existing_user = session.exec(select(User).where(User.email == payload.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return ResponseEnvelope(data=user)


@router.post("/login", response_model=ResponseEnvelope[TokenResponse])
def login(
    payload: LoginRequest, session: Session = Depends(get_session)
) -> ResponseEnvelope[TokenResponse]:
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user or not user.is_active or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token, _access_exp = create_access_token(user_id=user.id)  # type: ignore[arg-type]
    refresh_token, jti, refresh_exp = create_refresh_token(user_id=user.id)  # type: ignore[arg-type]

    session.add(RefreshToken(jti=jti, user_id=user.id, expires_at=refresh_exp))  # type: ignore[arg-type]
    session.commit()

    return ResponseEnvelope(
        data=TokenResponse(access_token=access_token, refresh_token=refresh_token)
    )


@router.post("/refresh", response_model=ResponseEnvelope[TokenResponse])
def refresh(
    payload: RefreshRequest, session: Session = Depends(get_session)
) -> ResponseEnvelope[TokenResponse]:
    token_data, row = require_active_refresh_token(token=payload.refresh_token, session=session)

    # Revoke old refresh token (rotation).
    row.revoked_at = datetime.now(UTC).replace(tzinfo=None)
    session.add(row)

    access_token, _access_exp = create_access_token(user_id=token_data.user_id)
    refresh_token, new_jti, refresh_exp = create_refresh_token(user_id=token_data.user_id)

    session.add(RefreshToken(jti=new_jti, user_id=token_data.user_id, expires_at=refresh_exp))
    session.commit()

    return ResponseEnvelope(
        data=TokenResponse(access_token=access_token, refresh_token=refresh_token)
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: LogoutRequest, session: Session = Depends(get_session)) -> None:
    _token_data, row = require_active_refresh_token(token=payload.refresh_token, session=session)

    row.revoked_at = datetime.now(UTC).replace(tzinfo=None)
    session.add(row)
    session.commit()
