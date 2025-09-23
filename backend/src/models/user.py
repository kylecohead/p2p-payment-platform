from sqlalchemy import Column, Integer, String, UniqueConstraint, Boolean, text
from sqlalchemy.orm import relationship
from ..config.database import SPBase

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
    admin = Column(Boolean, nullable=False, server_default=text("false"))

    accounts = relationship("Account", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}', admin={self.admin})>"
