from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    Numeric,
    DateTime,
    String,
    Index,
    text,
    func,
)
from sqlalchemy.orm import relationship
from ..config.database import SPBase

class Transaction(SPBase):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, server_default="ZAR")
    status = Column(String(30), nullable=False, server_default="pending")   
    kind = Column(String(30), nullable=False, server_default="transfer")     
    method = Column(String(30), nullable=True)                              
    reference = Column(String(128), nullable=True, unique=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=True,
        server_default=func.now(),
        server_onupdate=func.now(),
        onupdate=datetime.now,  
    )

    # relationships 
    sender = relationship("Account", foreign_keys=[sender_id], backref="outgoing_transactions")
    recipient = relationship("Account", foreign_keys=[recipient_id], backref="incoming_transactions")

Index("ix_transactions_sender_created", Transaction.sender_id, Transaction.created_at)
Index("ix_transactions_recipient_created", Transaction.recipient_id, Transaction.created_at)