from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from ..config.database import SPBase
import enum

class BlockType(str, enum.Enum):
    SENDER = "SENDER"
    RECIPIENT = "RECIPIENT"

class Block(SPBase):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True)
    block_type = Column(Enum(BlockType, name="block_type_enum"), nullable=False)
    # If SENDER: the user/account in 'subject_account_id' may not send
    # If RECIPIENT: the user/account in 'subject_account_id' may not receive
    subject_account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    removed_at = Column(DateTime(timezone=True), nullable=True)

    subject = relationship("Account")

    __table_args__ = (
        UniqueConstraint("block_type", "subject_account_id", name="uq_blocks_type_subject"),
    )
    