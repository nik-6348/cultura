import logging
import uuid
from typing import Annotated, Any

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import Settings, get_settings
from src.db.models.user import User
from src.db.models.workspace import WorkspaceMember
from src.db.session import get_db

logger = logging.getLogger(__name__)
security_bearer = HTTPBearer(auto_error=False)


class AuthError(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_401_UNAUTHORIZED) -> None:
        super().__init__(
            status_code=status_code,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


async def decode_token(
    credentials: HTTPAuthorizationCredentials | None,
    settings: Settings,
    dev_user_header: str | None = None,
) -> dict[str, Any]:
    """Verify Firebase ID token or dev token in local development."""
    # Allow dev override header in test / development mode
    if settings.environment in ("development", "test") and dev_user_header:
        parts = dev_user_header.split(":")
        uid = parts[0]
        email = parts[1] if len(parts) > 1 else f"{uid}@cultura.local"
        name = parts[2] if len(parts) > 2 else f"User {uid}"
        return {"uid": uid, "email": email, "name": name}

    if not credentials:
        raise AuthError("Authentication required. Please provide a Bearer token.")

    token = credentials.credentials

    # Development convenience token
    if settings.environment in ("development", "test") and token.startswith("dev_token"):
        parts = token.split(":")
        uid = parts[1] if len(parts) > 1 else "dev_user_default"
        email = parts[2] if len(parts) > 2 else "dev@cultura.local"
        name = parts[3] if len(parts) > 3 else "Dev User"
        return {"uid": uid, "email": email, "name": name}

    # Production Firebase Admin verification
    try:
        import firebase_admin.auth as fb_auth  # type: ignore[import-untyped,import-not-found]

        decoded = fb_auth.verify_id_token(token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email", ""),
            "name": decoded.get("name", ""),
            "avatar_url": decoded.get("picture", ""),
        }
    except Exception as e:
        logger.warning("Token verification failed: %s", e)
        raise AuthError("Invalid or expired authentication token.") from e


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_bearer)],
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    x_dev_user: Annotated[str | None, Header(alias="X-Dev-User")] = None,
) -> User:
    """Extract authenticated user and auto-provision user on first authenticated request."""
    claims = await decode_token(credentials, settings, x_dev_user)
    firebase_uid = claims["uid"]
    email = claims.get("email", f"{firebase_uid}@cultura.local")
    name = claims.get("name")
    avatar_url = claims.get("avatar_url")

    # Look up user in database
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-provision user record
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("Auto-provisioned new user %s (uid=%s)", user.id, firebase_uid)

    return user


async def verify_workspace_access(
    workspace_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> WorkspaceMember:
    """Enforce strict multi-tenant workspace isolation."""
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: You are not a member of workspace {workspace_id}.",
        )

    return membership
