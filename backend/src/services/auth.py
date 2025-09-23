"""Authentication service for password hashing and verification."""

from passlib.context import CryptContext
from sqlalchemy.orm import Session
from ..models.user import User
from typing import Optional

# Password context for bcrypt hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    """Service class for authentication-related operations."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a plain text password using bcrypt."""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plain text password against a hashed password."""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def set_user_password(user: User, password: str) -> None:
        """Hash the password and set it for the user."""
        user.password_hash = AuthService.hash_password(password)  # type: ignore
    
    @staticmethod
    def check_user_password(user: User, password: str) -> bool:
        """Verify a password for a user."""
        if user.password_hash is None:
            return False
        return AuthService.verify_password(password, str(user.password_hash))
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate a user by email and password."""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        
        if not AuthService.check_user_password(user, password):
            return None
            
        return user
    
    @staticmethod
    def create_user_with_password(db: Session, name: str, email: str, phone: str, password: str, admin: bool = False) -> User:
        """Create a new user with a hashed password."""
        user = User(
            name=name,
            email=email,
            phone=phone,
            admin=admin,
        )
        AuthService.set_user_password(user, password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
