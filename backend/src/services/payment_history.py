"""
Payment history service for managing transaction payment history metadata.

This service handles the creation and management of payment history data
that gets stored in the JSON field of transactions. It properly handles
credit/debit perspectives and generates display-friendly data.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.transaction import Transaction
from ..models.account import Account
from ..models.user import User
from .payment_reference import PaymentReferenceService


class PaymentHistoryService:
    """Service for managing payment history metadata."""
    
    @staticmethod
    def create_payment_history_data(
        db: Session,
        transaction: Transaction,
        description: str,
        perspective_account_id: int
    ) -> Dict[str, Any]:
        """
        Create payment history data for a specific account's perspective.
        
        Args:
            db: Database session
            transaction: The transaction object
            description: Description of the payment
            perspective_account_id: ID of the account viewing this history
            
        Returns:
            Dictionary containing payment history data
        """
        # Get the account and user information for perspective
        perspective_account = db.query(Account).filter(
            Account.id == perspective_account_id
        ).first()
        
        if not perspective_account:
            raise ValueError(f"Account {perspective_account_id} not found")
        
        # Get sender and recipient information
        sender_account = db.query(Account).filter(
            Account.id == transaction.sender_id
        ).first()
        recipient_account = db.query(Account).filter(
            Account.id == transaction.recipient_id
        ).first()
        
        if not sender_account or not recipient_account:
            raise ValueError("Sender or recipient account not found")
        
        # Get user information
        sender_user = db.query(User).filter(
            User.id == sender_account.user_id
        ).first()
        recipient_user = db.query(User).filter(
            User.id == recipient_account.user_id
        ).first()
        
        if not sender_user or not recipient_user:
            raise ValueError("Sender or recipient user not found")
        
        # Determine if this is a credit or debit from the perspective account's view
        is_credit = perspective_account_id == transaction.recipient_id
        transaction_type = "Credit" if is_credit else "Debit"
        
        # Determine the amount and sign
        amount = float(transaction.amount)
        if not is_credit:
            amount = -amount  # Debit should be negative
        
        # Determine the other party's name
        other_party_name = recipient_user.name if not is_credit else sender_user.name
        
        # Generate unique transaction code for display
        transaction_code = PaymentReferenceService.generate_transaction_code(db)
        
        # Create the payment history data
        payment_history = {
            "code": transaction_code,
            "type": transaction_type,
            "description": description,
            "time": transaction.created_at.strftime("%H:%M"),
            "date": transaction.created_at.strftime("%Y-%m-%d"),
            "name": other_party_name,
            "amount": amount,
            "reference": transaction.reference,
            "status": transaction.status,
            "method": transaction.method or "transfer",
            "created_at": transaction.created_at.isoformat(),
            "transaction_id": transaction.id
        }
        
        return payment_history
    
    @staticmethod
    def update_transaction_payment_history(
        db: Session,
        transaction: Transaction,
        description: str
    ) -> None:
        """
        Update the transaction with payment history data for both sender and recipient.
        
        This creates a comprehensive payment history object that contains data
        for both perspectives.
        
        Args:
            db: Database session
            transaction: The transaction to update
            description: Description of the payment
        """
        # Generate sender's perspective (debit)
        sender_history = PaymentHistoryService.create_payment_history_data(
            db, transaction, description, transaction.sender_id
        )
        
        # Generate recipient's perspective (credit)
        recipient_history = PaymentHistoryService.create_payment_history_data(
            db, transaction, description, transaction.recipient_id
        )
        
        # Store both perspectives on the corresponding accounts' payment_history arrays
        # Ensure account rows exist and initialize arrays if needed
        sender_account = db.query(Account).filter(Account.id == transaction.sender_id).first()
        recipient_account = db.query(Account).filter(Account.id == transaction.recipient_id).first()

        if not sender_account or not recipient_account:
            raise ValueError("Sender or recipient account not found when storing payment history")

        # Prepare per-account perspective entries
        # Append the perspective entry to the account.payment_history list (stored as JSON array)
        # Initialize as list if None
        if getattr(sender_account, 'payment_history', None) is None:
            sender_account.payment_history = []
        if getattr(recipient_account, 'payment_history', None) is None:
            recipient_account.payment_history = []
        # Use reassignment instead of in-place append so SQLAlchemy detects changes
        sender_list = list(sender_account.payment_history or [])
        recipient_list = list(recipient_account.payment_history or [])
        sender_list.append(sender_history)
        recipient_list.append(recipient_history)

        sender_account.payment_history = sender_list
        recipient_account.payment_history = recipient_list

        db.add(sender_account)
        db.add(recipient_account)
        db.commit()
    
    @staticmethod
    def get_payment_history_for_account(
        db: Session,
        account_id: int,
        limit: int = 100
    ) -> list[Dict[str, Any]]:
        """
        Get payment history for a specific account.
        
        Args:
            db: Database session
            account_id: Account ID to get history for
            limit: Maximum number of transactions to return
            
        Returns:
            List of payment history entries from the account's perspective
        """
        # Read payment history stored directly on the account row
        account = db.query(Account).filter(Account.id == account_id).first()
        if account and getattr(account, 'payment_history', None):
            arr = account.payment_history or []
            return list(reversed(arr))[:limit]

        # No account-level history available
        return []
    
    @staticmethod
    def generate_payment_description(
        sender_name: str,
        recipient_name: str,
        amount: Decimal,
        method: Optional[str] = None
    ) -> str:
        """
        Generate a default payment description.
        
        Args:
            sender_name: Name of the sender
            recipient_name: Name of the recipient
            amount: Transaction amount
            method: Payment method
            
        Returns:
            Generated description string
        """
        method_text = f" via {method}" if method else ""
        return f"Payment of R{amount:.2f} from {sender_name} to {recipient_name}{method_text}"