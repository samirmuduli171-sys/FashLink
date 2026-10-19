import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.models.pending_registration import PendingRegistration
from app.models.schemas import (
    UserRegister,
    UserLogin,
    Token,
    VerifyEmailRequest,
    ResendCodeRequest,
)
from app.utils.auth_utils import hash_password, verify_password, create_access_token
from app.utils.email_service import send_verification_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

CODE_TTL_MINUTES = 10
MAX_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 30


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _new_code():
    return f"{secrets.randbelow(1000000):06d}"


def _hash_code(code: str):
    return hashlib.sha256(code.encode()).hexdigest()


@router.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,30}", user_data.username):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-30 characters: letters, numbers, _ . - only",
        )

    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    role_value = user_data.role.value if hasattr(user_data.role, "value") else str(user_data.role)

    pending = db.query(PendingRegistration).filter(
        PendingRegistration.email == user_data.email
    ).first()
    if not pending:
        pending = PendingRegistration(email=user_data.email)
        db.add(pending)

    code = _new_code()
    now = _now()
    pending.username = user_data.username
    pending.hashed_password = hash_password(user_data.password)
    pending.full_name = user_data.full_name
    pending.role = role_value
    pending.code_hash = _hash_code(code)
    pending.expires_at = now + timedelta(minutes=CODE_TTL_MINUTES)
    pending.sent_at = now
    pending.attempts = 0
    db.commit()

    try:
        send_verification_email(user_data.email, code)
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Could not send the verification email. Check the address and try again.",
        )

    return {"message": "Verification code sent", "email": user_data.email}


@router.post("/verify-email", response_model=Token)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    pending = db.query(PendingRegistration).filter(
        PendingRegistration.email == data.email
    ).first()
    if not pending:
        raise HTTPException(status_code=400, detail="No signup found for this email. Register again.")

    if _now() > pending.expires_at:
        raise HTTPException(status_code=400, detail="Code expired. Request a new one.")

    if pending.attempts >= MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many wrong attempts. Request a new code.")

    if not secrets.compare_digest(_hash_code(data.code.strip()), pending.code_hash):
        pending.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect code")

    taken = db.query(User).filter(
        (User.email == pending.email) | (User.username == pending.username)
    ).first()
    if taken:
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=400, detail="Email or username already registered")

    new_user = User(
        username=pending.username,
        email=pending.email,
        hashed_password=pending.hashed_password,
        full_name=pending.full_name,
        role=pending.role,
    )
    db.add(new_user)
    db.delete(pending)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id)})
    return Token(access_token=token)


@router.post("/resend-code")
def resend_code(data: ResendCodeRequest, db: Session = Depends(get_db)):
    pending = db.query(PendingRegistration).filter(
        PendingRegistration.email == data.email
    ).first()
    if not pending:
        raise HTTPException(status_code=400, detail="No signup found for this email. Register again.")

    now = _now()
    if (now - pending.sent_at).total_seconds() < RESEND_COOLDOWN_SECONDS:
        raise HTTPException(status_code=429, detail="Please wait a few seconds before requesting another code.")

    code = _new_code()
    pending.code_hash = _hash_code(code)
    pending.expires_at = now + timedelta(minutes=CODE_TTL_MINUTES)
    pending.sent_at = now
    pending.attempts = 0
    db.commit()

    try:
        send_verification_email(pending.email, code)
    except Exception:
        raise HTTPException(status_code=502, detail="Could not send the verification email.")

    return {"message": "New code sent"}


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token)
