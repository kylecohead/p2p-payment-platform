from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, UniqueConstraint, text
from sqlalchemy.orm import relationship
from ..config.database import SPBase

class Account(SPBase):
    __tablename__ = "accounts"

    __table_args__ = (
        UniqueConstraint("account_number", name="uq_accounts_account_number"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_number = Column(String(64), nullable=False)
    balance = Column(Numeric(12, 2), nullable=False, server_default=text("0"))

    user = relationship("User", back_populates="accounts")

    def __repr__(self):
        return f"<Account(id={self.id}, user_id={self.user_id}, account_number='{self.account_number}')>"
