from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
import jwt

SECRET_KEY = "integral-calculus-platform-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 168  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_current_user_from_token(token: str) -> dict | None:
    """Extract user info from a Bearer token string."""
    if token and token.startswith("Bearer "):
        token = token[7:]
    return decode_access_token(token)


def get_current_user(authorization: str = Header(None)):
    """Shared FastAPI dependency to extract and validate the current user from JWT.
    Returns the decoded token payload (dict with 'sub', 'role', 'username').
    Route handlers must query the DB for the full user if needed.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_data = get_current_user_from_token(authorization)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_data
