"""
JWT auth utilities — sign / verify tokens.
SECRET_KEY loaded from .env (falls back to a dev default).
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

SECRET_KEY = os.getenv("JWT_SECRET", "nexora-dev-secret-change-in-prod-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def create_access_token(data: dict) -> str:
    try:
        from jose import jwt  # type: ignore
    except ImportError:
        raise RuntimeError("python-jose not installed. Run: pip install python-jose[cryptography]")

    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        from jose import jwt, JWTError  # type: ignore
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None
