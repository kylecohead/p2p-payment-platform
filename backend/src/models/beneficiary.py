from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..config.database import SPBase


class Beneficiary(SPBase):
    __tablename__ = "beneficiaries"

    __table_args__ = (
        UniqueConstraint("owner_user_id", "recipient_user_id", name="uq_beneficiaries_owner_recipient"),
    )

    id = Column(Integer, primary_key=True)
    owner_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    account_number = Column(String(64), nullable=True)
    nickname = Column(String(64), nullable=True)

    created_at = Column(func.now())
    last_used_at = Column(func.now())
    usage_count = Column(Integer, nullable=False, server_default="0")

    owner = relationship("User", foreign_keys=[owner_user_id], backref="beneficiaries")
    recipient = relationship("User", foreign_keys=[recipient_user_id])

    def __repr__(self):
        return f"<Beneficiary(id={self.id}, owner={self.owner_user_id}, recipient={self.recipient_user_id}, email='{self.email}')>"
