"""
Auth router: /api/auth/register, login, me, update-profile
Supports both Phone Number and Email registration and login.
"""
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, field_validator

from app.data.user_store import (
    create_user,
    get_user,
    phone_exists,
    email_exists,
    update_user,
)
from app.services.auth_service import create_access_token, decode_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    password: str
    preferred_language: str = "en"
    crop_type: str = "Paddy (Rice)"
    crop_mode: str = "paddy"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Name cannot be empty")
        return s

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        clean = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean):
            raise ValueError("Invalid email format")
        return clean

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"[^\d+]", "", v.strip())
        if len(digits) < 10:
            raise ValueError("Phone number must contain at least 10 digits")
        return digits

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v.strip()) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v.strip()


class LoginRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    identifier: Optional[str] = None
    password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    preferred_language: Optional[str] = None
    crop_type: Optional[str] = None
    crop_mode: Optional[str] = None
    farm_profile: Optional[dict] = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _hash_pw(password: str) -> str:
    try:
        import bcrypt  # type: ignore
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    except ImportError:
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()


def _verify_pw(password: str, hashed: str) -> bool:
    try:
        import bcrypt  # type: ignore
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ImportError:
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest() == hashed


def _safe_user(user: dict) -> dict:
    return {k: v for k, v in user.items() if k != "password_hash"}


def _get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization[len("Bearer "):]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # lookup by phone, email, or user_id
    ident = payload.get("phone") or payload.get("email") or payload.get("user_id")
    if not ident:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = get_user(ident)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
def register(req: RegisterRequest):
    if phone_exists(req.phone):
        raise HTTPException(status_code=409, detail="Phone number already registered")
    if req.email and email_exists(req.email):
        raise HTTPException(status_code=409, detail="Email address already registered")

    hashed = _hash_pw(req.password)
    user = create_user(
        phone=req.phone,
        email=req.email,
        name=req.name,
        password_hash=hashed,
        preferred_language=req.preferred_language,
        crop_type=req.crop_type,
        crop_mode=req.crop_mode,
    )
    token = create_access_token({
        "phone": user["phone"],
        "email": user.get("email"),
        "user_id": user["user_id"],
    })
    return {"token": token, "user": _safe_user(user)}


@router.post("/login")
def login(req: LoginRequest):
    ident = (req.identifier or req.email or req.phone or "").strip()
    if not ident:
        raise HTTPException(status_code=400, detail="Please enter your email or phone number")

    user = get_user(ident)
    if not user or not _verify_pw(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email/phone or password")

    token = create_access_token({
        "phone": user["phone"],
        "email": user.get("email"),
        "user_id": user["user_id"],
    })
    return {"token": token, "user": _safe_user(user)}


@router.get("/me")
def me(current_user: dict = Depends(_get_current_user)):
    return _safe_user(current_user)


@router.put("/update-profile")
def update_profile(req: UpdateProfileRequest, current_user: dict = Depends(_get_current_user)):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if not updates:
        return _safe_user(current_user)

    if "email" in updates and updates["email"]:
        # check if already taken by another user
        existing = get_user(updates["email"])
        if existing and existing["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=409, detail="Email already in use by another account")

    updated = update_user(current_user["phone"], updates)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return _safe_user(updated)
