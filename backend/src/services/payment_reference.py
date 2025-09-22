"""
Payment reference generation service.

Generates unique payment references that ensure each transaction has a unique
identifier that never matches any other transaction.
"""

import secrets
import string
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.transaction import Transaction


class PaymentReferenceService:
    """Service for generating unique payment references."""
    
    @staticmethod
    def generate_reference_code(length: int = 12) -> str:
        """
        Generate a random alphanumeric reference code.
        
        Args:
            length: Length of the reference code (default 12)
            
        Returns:
            Random alphanumeric string
        """
        # Use uppercase letters and digits for better readability
        alphabet = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    def generate_unique_reference(db: Session, prefix: str = "TXN") -> str:
        """
        Generate a unique payment reference that doesn't exist in the database.
        
        Args:
            db: Database session
            prefix: Prefix for the reference (default "TXN")
            
        Returns:
            Unique reference string in format: PREFIX-YYYYMMDD-RANDOMCODE
        """
        date_str = datetime.now().strftime("%Y%m%d")
        max_attempts = 100  # Prevent infinite loops
        
        for _ in range(max_attempts):
            # Generate reference with date component for easier tracking
            random_code = PaymentReferenceService.generate_reference_code(8)
            reference = f"{prefix}-{date_str}-{random_code}"
            
            # Check if this reference already exists
            existing = db.query(Transaction).filter(
                Transaction.reference == reference
            ).first()
            
            if not existing:
                return reference
        
        # Fallback: use timestamp + longer random code if all attempts failed
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_code = PaymentReferenceService.generate_reference_code(12)
        return f"{prefix}-{timestamp}-{random_code}"
    
    @staticmethod
    def generate_transaction_code(db: Session) -> str:
        """
        Generate a unique transaction code for frontend display.
        
        This is different from the reference and is used for display purposes
        in the payment history.
        
        Args:
            db: Database session
            
        Returns:
            Unique transaction code in format: TXN000001
        """
        # Get the next transaction ID from the sequence
        # This ensures sequential, unique codes
        from sqlalchemy import text
        next_id = db.execute(
            text("SELECT nextval('transactions_id_seq')")
        ).scalar()
        
        return f"TXN{next_id:06d}"
    
    @staticmethod
    def validate_reference_uniqueness(db: Session, reference: str) -> bool:
        """
        Check if a reference is unique in the database.
        
        Args:
            db: Database session
            reference: Reference to check
            
        Returns:
            True if unique, False if already exists
        """
        existing = db.query(Transaction).filter(
            Transaction.reference == reference
        ).first()
        
        return existing is None