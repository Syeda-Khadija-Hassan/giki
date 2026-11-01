# backend/app/security.py
import hashlib
import hmac
import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, UserRole

SECRET_KEY = os.getenv("JWT_SECRET", "giki-women-jwt-secret-key-super-secure-min-32-chars-2026")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
HMAC_SECRET = os.getenv("HMAC_SECRET", "giki-gatepass-hmac-sha256-digital-signature-key-2026").encode("utf-8")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user


def require_role(*required_roles: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in required_roles:
            roles_str = ", ".join([r.value for r in required_roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires authorization from role(s): {roles_str}.",
            )
        return current_user
    return role_checker


# ==============================================================
# HMAC-SHA256 DIGITAL GATE PASS SIGNING & VERIFICATION
# ==============================================================

def generate_pass_signature(
    pass_id: int,
    student_id: int,
    destination: str,
    departure_time: datetime,
    expected_return_time: datetime,
    approved_at: datetime,
) -> str:
    """Generate tamper-proof HMAC-SHA256 signature for approved gate pass."""
    payload = f"{pass_id}|{student_id}|{destination}|{departure_time.isoformat()}|{expected_return_time.isoformat()}|{approved_at.isoformat()}"
    signature = hmac.new(HMAC_SECRET, payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"GW-PASS-{pass_id}-{signature}"


def verify_pass_signature(
    token: str,
    pass_id: int,
    student_id: int,
    destination: str,
    departure_time: datetime,
    expected_return_time: datetime,
    approved_at: datetime,
) -> bool:
    """Reconstruct expected HMAC signature and perform constant-time comparison."""
    if not token or not token.startswith("GW-PASS-"):
        return False
    expected_token = generate_pass_signature(
        pass_id=pass_id,
        student_id=student_id,
        destination=destination,
        departure_time=departure_time,
        expected_return_time=expected_return_time,
        approved_at=approved_at,
    )
    return hmac.compare_digest(token, expected_token)
