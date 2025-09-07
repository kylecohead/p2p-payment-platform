from sqlalchemy import Column, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from ..config.database import SPBase
from ..services.auth import AuthService

class User(SPBase):
    __tablename__ = "users"

    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=True)

    accounts = relationship("Account", back_populates="user")

    def set_password(self, password: str) -> None:
        """Hash the password and set it for the user."""
        self.password_hash = AuthService.hash_password(password)
    
    def check_password(self, password: str) -> bool:
        """Verify a password."""
        if self.password_hash is None:
            return False
        return AuthService.verify_password(password, str(self.password_hash))

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}')>"
