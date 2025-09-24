from __future__ import annotations
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Tuple, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..models.transaction import Transaction
from ..models.account import Account
from ..models.alert import Alert
from ..models.block import Block, BlockType

# Constants per spec
AMOUNT_LIMIT = Decimal("5000.00")
DAILY_LIMIT  = Decimal("10000.00")
BURST_WINDOW_SECONDS = 60
BURST_MAX = 3 # transaction limit within BURST_WINDOW_SECONDS

class RuleEngineResult(Tuple[bool, List[Alert], List[str]]): ...
# allowed, alerts, violation_codes

class RuleEngine:
    ''' Evaluates transfer rules and returns whether the transfer is allowed, any generated alerts, and violation codes.
    '''
    @staticmethod
    def _now():
        return datetime.now(timezone.utc)

    @staticmethod
    def _start_of_local_day(now_utc: datetime) -> datetime:
        # Assuming server in UTC, Africa/Johannesburg is UTC+2 (no DST)
        return now_utc.replace(hour=0, minute=0, second=0, microsecond=0)

    @classmethod
    def evaluate(
        cls, db: Session, *, sender: Account, recipient: Account, amount: Decimal
    ) -> Tuple[bool, List[Alert], List[str]]:
        now = cls._now()
        alerts: List[Alert] = []
        violations: List[str] = []

        # Hard blocks (admin)
        sender_block = db.query(Block).filter(
            Block.block_type == BlockType.SENDER,
            Block.subject_account_id == sender.id,
            Block.removed_at.is_(None),
        ).first()
        if sender_block:
            violations.append("BLOCKED_SENDER")

        recipient_block = db.query(Block).filter(
            Block.block_type == BlockType.RECIPIENT,
            Block.subject_account_id == recipient.id,
            Block.removed_at.is_(None),
        ).first()
        if recipient_block:
            violations.append("BLOCKED_RECIPIENT")

        # Balance checks (hard stops per good banking sense)
        new_balance = (sender.balance or Decimal("0")) - amount
        # Negative balance rule
        if new_balance < 0:
            alerts.append(Alert(
                sender_account_id=sender.id,
                recipient_account_id=recipient.id,
                code="NEGATIVE_BAL",
                message="Transfer would result in a negative balance.",
                created_at=now, updated_at=now, cleared=False
            ))
            violations.append("NEGATIVE_BAL")
            # Zero balance rule
        elif new_balance == 0:
            alerts.append(Alert(
                sender_account_id=sender.id,
                recipient_account_id=recipient.id,
                code="ZERO_BAL",
                message="Transfer would drain the account to exactly zero.",
                created_at=now, updated_at=now, cleared=False
            ))
            violations.append("ZERO_BAL")

        # Amount rule (> R5000)
        if amount > AMOUNT_LIMIT:
            alerts.append(Alert(
                sender_account_id=sender.id,
                recipient_account_id=recipient.id,
                code="AMOUNT_LIMIT",
                message=f"Transfer amount exceeds R{AMOUNT_LIMIT.normalize()}.",
                created_at=now, updated_at=now, cleared=False
            ))
            violations.append("AMOUNT_TOO_LARGE")

        # Burst rule: more than 3 transfers in 60s
        window_start = now - timedelta(seconds=BURST_WINDOW_SECONDS)
        recent_count = db.query(Transaction).filter(
            Transaction.sender_id == sender.id,
            Transaction.created_at >= window_start,
            Transaction.status.in_(["pending", "completed"])
        ).count()
        # More than 3 transfers ... within 60 seconds
        if (recent_count + 1) > BURST_MAX:
            alerts.append(Alert(
                sender_account_id=sender.id,
                recipient_account_id=recipient.id,
                code="BURSTING_60S",
                message=f"More than {BURST_MAX} transfers initiated within {BURST_WINDOW_SECONDS}s.",
                created_at=now, updated_at=now, cleared=False
            ))
            violations.append("TOO_MANY_TRANSACTIONS_60S")

        # Daily total sent (> R10000)
        start_of_day = cls._start_of_local_day(now)
        day_total: Decimal = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.sender_id == sender.id,
            Transaction.created_at >= start_of_day,
            Transaction.status.in_(["pending", "completed"])
        ).scalar() or Decimal("0")
        projected_total = day_total + amount
        if projected_total > DAILY_LIMIT:
            alerts.append(Alert(
                sender_account_id=sender.id,
                recipient_account_id=recipient.id,
                code="DAILY_LIMIT",
                message=f"Projected daily total sent exceeds R{DAILY_LIMIT.normalize()}.",
                created_at=now, updated_at=now, cleared=False
            ))
            violations.append("DAILY_AMOUNT_LIMIT_EXCEEDED")

        """ allowed = len([v for v in violations if v in ("BLOCKED_SENDER","BLOCKED_RECIPIENT","NEGATIVE_BAL",
                                                       "AMOUNT_TOO_LARGE", "TOO_MANY_TRANSACTIONS_60S",
                                                       "DAILY_AMOUNT_LIMIT_EXCEEDED", "ZERO_BAL"
                                                       )]) == 0 """
        allowed = len(violations) == 0 # temporary autoblock for any violation
        return allowed, alerts, violations
