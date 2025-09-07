from sqlalchemy import Column, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from ..config.database import SPBase
from passlib.context import CryptContext

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
        self.password_hash = "12345"

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}')>"
