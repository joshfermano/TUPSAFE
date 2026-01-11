"""Authentication middleware for JWT validation."""

import base64
import logging
import sys
from typing import Annotated

import jwt
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ...config import settings

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()

# Cache for JWT secrets - we may need to try multiple formats
_jwt_secrets_cache: list[bytes] | None = None


async def get_user_role_from_db(user_id: str) -> str | None:
    """
    Fetch the user's role from the profiles table in Supabase.

    Args:
        user_id: The user's UUID from the JWT

    Returns:
        The user's role or None if not found
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/profiles",
                params={
                    "id": f"eq.{user_id}",
                    "select": "role"
                },
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=10.0
            )

            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    role = data[0].get("role")
                    logger.debug(f"[AUTH] Fetched role from DB: {role}")
                    return role
            else:
                logger.debug(f"[AUTH] Failed to fetch role from DB: {response.status_code} {response.text}")
    except Exception as e:
        logger.debug(f"[AUTH] Error fetching role from DB: {e}")

    return None


def get_jwt_secrets() -> list[bytes]:
    """
    Get JWT secrets to try for verification.

    Returns a list of possible secret formats to try:
    1. Raw string as bytes (most common for Supabase)
    2. Base64 decoded (some Supabase setups)
    """
    global _jwt_secrets_cache

    if _jwt_secrets_cache is not None:
        return _jwt_secrets_cache

    secret = settings.SUPABASE_JWT_SECRET
    secrets = []

    # First, try the raw secret string (most common for Supabase)
    raw_secret = secret.encode('utf-8')
    secrets.append(raw_secret)
    logger.debug(f"[AUTH] Added raw secret: {len(raw_secret)} bytes")

    # Also try base64 decoded version
    try:
        decoded_secret = base64.b64decode(secret)
        if decoded_secret != raw_secret:
            secrets.append(decoded_secret)
            logger.debug(f"[AUTH] Added base64 decoded secret: {len(decoded_secret)} bytes")
    except Exception as e:
        logger.debug(f"[AUTH] Base64 decode failed: {e}")

    _jwt_secrets_cache = secrets
    return secrets


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> dict:
    """
    Validate JWT token and extract user information.

    Args:
        credentials: HTTP Authorization credentials with Bearer token

    Returns:
        User dictionary with id, email, and role

    Raises:
        HTTPException: If token is invalid or user doesn't have required permissions
    """
    logger.info("=== get_current_user called ===")
    token = credentials.credentials

    try:
        # Get all possible JWT secrets to try
        jwt_secrets = get_jwt_secrets()

        # Debug: Log token info (first/last chars only for security)
        logger.debug(f"[AUTH] Token length: {len(token)}, starts with: {token[:20]}...")
        logger.debug(f"[AUTH] Will try {len(jwt_secrets)} secret formats")

        # First, try to decode without verification to inspect the token
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            logger.debug(f"[AUTH] Token claims (unverified): aud={unverified.get('aud')}, iss={unverified.get('iss')}, sub={unverified.get('sub')}")
        except Exception as e:
            logger.debug(f"[AUTH] Could not decode token for inspection: {e}")

        # Try each secret format until one works
        payload = None
        last_error = None
        for i, jwt_secret in enumerate(jwt_secrets):
            try:
                logger.debug(f"[AUTH] Trying secret format {i+1}/{len(jwt_secrets)} ({len(jwt_secret)} bytes)...")
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
                logger.debug(f"[AUTH] JWT verification successful with secret format {i+1}!")
                break
            except jwt.InvalidSignatureError as e:
                logger.debug(f"[AUTH] Secret format {i+1} failed: Invalid signature")
                last_error = e
                continue
            except Exception as e:
                logger.debug(f"[AUTH] Secret format {i+1} failed: {type(e).__name__}: {e}")
                last_error = e
                continue

        if payload is None:
            logger.warning("[AUTH] All secret formats failed - JWT verification failed")
            raise last_error or jwt.InvalidSignatureError("No valid secret found")

        # Extract user information
        user_id = payload.get("sub")
        email = payload.get("email")
        user_metadata = payload.get("user_metadata", {})
        app_metadata = payload.get("app_metadata", {})

        # Debug: Print full payload structure to find role location
        logger.debug(f"[AUTH] Full payload keys: {list(payload.keys())}")
        logger.debug(f"[AUTH] user_metadata: {user_metadata}")
        logger.debug(f"[AUTH] app_metadata: {app_metadata}")

        # Get role from multiple possible locations
        # 1. app_metadata.role (preferred for Supabase)
        # 2. user_metadata.role
        # 3. Direct role claim in payload (but not 'authenticated' which is Supabase default)
        # 4. app_metadata.claims_admin for legacy setups
        jwt_role = payload.get("role")
        role = (
            app_metadata.get("role") or
            user_metadata.get("role") or
            (jwt_role if jwt_role and jwt_role != "authenticated" else None) or
            ("admin" if app_metadata.get("claims_admin") else None)
        )
        logger.debug(f"[AUTH] Role from JWT: {role}")

        if not user_id or not email:
            logger.debug(f"[AUTH] Missing user_id or email in token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

        # If role not found in JWT, fetch from database
        allowed_roles = {"admin", "co_admin", "hr"}
        if role not in allowed_roles:
            logger.debug(f"[AUTH] Role '{role}' not in allowed roles, fetching from DB...")
            db_role = await get_user_role_from_db(user_id)
            if db_role:
                role = db_role
                logger.debug(f"[AUTH] Using role from DB: {role}")

        # Verify user has required role for AI agent access
        if role not in allowed_roles:
            logger.debug(f"[AUTH] User role '{role}' not in allowed roles")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}",
            )

        logger.debug(f"[AUTH] Authentication successful for user {user_id} with role {role}")

        return {
            "id": user_id,
            "email": email,
            "role": role,
            "metadata": user_metadata,
        }

    except jwt.ExpiredSignatureError:
        logger.warning("[AUTH] Token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidAudienceError:
        logger.warning("[AUTH] Invalid token audience - not 'authenticated'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience",
        )
    except jwt.InvalidSignatureError:
        logger.warning("[AUTH] Invalid token signature - JWT secret mismatch")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature",
        )
    except jwt.DecodeError as e:
        logger.warning(f"[AUTH] Token decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authentication token",
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"[AUTH] Invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    except HTTPException:
        # Re-raise HTTP exceptions without wrapping
        raise
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        logger.error(f"[AUTH] Unexpected error: {error_type}: {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error ({error_type}): {error_msg}",
        )


async def verify_admin_role(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Verify user has admin role.

    Args:
        current_user: Current authenticated user

    Returns:
        User dictionary if admin

    Raises:
        HTTPException: If user is not admin
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user


async def verify_hr_or_admin_role(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Verify user has HR or admin role.

    Args:
        current_user: Current authenticated user

    Returns:
        User dictionary if HR or admin

    Raises:
        HTTPException: If user is not HR or admin
    """
    if current_user["role"] not in {"admin", "co_admin", "hr"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR or admin role required",
        )
    return current_user
