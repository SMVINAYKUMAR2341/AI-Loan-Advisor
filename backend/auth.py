"""
Authentication Module with JWT Support
======================================
- Password hashing with bcrypt
- JWT token creation and verification
- Role-based access control (customer, bank_officer)
"""

import os
from datetime import datetime, timedelta
from typing import Optional, List

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db


# =============================================================================
# CONFIGURATION
# =============================================================================

# JWT Settings - In production, use environment variables
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production-32chars")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 2880  # 48 hours - further extended for UX

# Password hashing - using pbkdf2_sha256 (no password length limit, unlike bcrypt)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# OAuth2 scheme for token extraction from headers
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# =============================================================================
# PASSWORD UTILITIES
# =============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Truncate to 72 bytes to match bcrypt limit
    truncated = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(truncated, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password (bcrypt has 72-byte limit, truncate if needed)"""
    if password is None:
        raise ValueError("Password cannot be None")
    # Force truncate to 72 bytes for bcrypt - encode first to handle unicode
    password_bytes = password.encode('utf-8')[:72]
    truncated = password_bytes.decode('utf-8', errors='ignore')
    print(f"DEBUG: password length={len(password)}, truncated length={len(truncated)}, bytes={len(password_bytes)}")
    try:
        return pwd_context.hash(truncated)
    except Exception as e:
        print(f"HASH ERROR: {e}")
        # Fallback - use even shorter if needed
        return pwd_context.hash(password[:50])


# =============================================================================
# JWT TOKEN UTILITIES
# =============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data (should include user_id and role)
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token.
    
    Returns:
        Decoded payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# =============================================================================
# DEPENDENCY INJECTION - AUTHENTICATION
# =============================================================================

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """
    FastAPI dependency to get the current authenticated user.
    
    Raises:
        HTTPException 401 if token is invalid or user not found
    """
    import models  # Import here to avoid circular imports
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify token
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    
    # Fetch user from database
    try:
        from uuid import UUID as PyUUID
        uuid_obj = PyUUID(user_id)
        query = select(models.User).where(models.User.id == uuid_obj)
        result = await db.execute(query)
        user = result.scalars().first()
        
        if user is None:
            raise credentials_exception
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated"
            )
        
        return user
        
    except ValueError:
        raise credentials_exception


async def get_current_active_user(current_user = Depends(get_current_user)):
    """
    Ensure the current user is active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


# =============================================================================
# ROLE-BASED ACCESS CONTROL
# =============================================================================

def require_role(allowed_roles: List[str]):
    """
    Factory function to create a role-checking dependency.
    
    Usage:
        @app.get("/admin-only")
        async def admin_endpoint(user = Depends(require_role(["bank_officer"]))):
            ...
    
    Args:
        allowed_roles: List of role names that can access the endpoint
    
    Returns:
        Dependency function that checks user role
    """
    async def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


# Role shortcuts for common use cases
require_customer = require_role(["customer"])
require_officer = require_role(["bank_officer"])
require_any_authenticated = require_role(["customer", "bank_officer"])


# =============================================================================
# OPTIONAL: Token for non-protected endpoints
# =============================================================================

async def get_optional_user(
    token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="login", auto_error=False)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user if authenticated, None otherwise.
    Useful for endpoints that work for both authenticated and anonymous users.
    """
    if token is None:
        return None
    
    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None

