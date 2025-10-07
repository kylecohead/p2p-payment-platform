"""Authentication service for password hashing and verification."""

from typing import Optional
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from ..models.user import User

# Prefer bcrypt_sha256 for new hashes; still accept old bcrypt hashes.
pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated="auto",
    # optional tuning:
    # bcrypt_sha256__rounds=12,
    # bcrypt__rounds=12,
)

class AuthService:
    """Service class for authentication-related operations."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a plain text password (no 72-byte limit)."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password and opportunistically upgrade legacy hashes."""
        ok = pwd_context.verify(plain_password, hashed_password)
        return ok

    @staticmethod
    def needs_rehash(hashed_password: str) -> bool:
        """Check if a stored hash should be upgraded to the current scheme/cost."""
        return pwd_context.needs_update(hashed_password)

    @staticmethod
    def set_user_password(user: User, password: str) -> None:
        user.password_hash = AuthService.hash_password(password)  # type: ignore

    @staticmethod
    def check_user_password(user: User, password: str) -> bool:
        if user.password_hash is None:
            return False
        return AuthService.verify_password(password, str(user.password_hash))

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        user = db.query(User).filter(User.email == email).first()
        if not user or user.password_hash is None:
            return None
        # verify first
        if not AuthService.verify_password(password, user.password_hash):
            return None
        # upgrade to bcrypt_sha256 if the stored hash is legacy/cost is outdated
        if AuthService.needs_rehash(user.password_hash):
            user.password_hash = AuthService.hash_password(password)
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def create_user_with_password(db: Session, name: str, email: str, phone: str,
                                  password: str, admin: bool = False) -> User:
        user = User(name=name, email=email, phone=phone, admin=admin)
        AuthService.set_user_password(user, password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
