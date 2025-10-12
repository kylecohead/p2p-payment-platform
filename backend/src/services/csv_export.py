# CSV export service for admin functionality
import csv
import io
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from ..models.transaction import Transaction
from ..models.alert import Alert
from ..models.block import Block
from ..models.account import Account
from ..models.user import User


class CSVExportService:
    # Service for exporting flagged payments and admin data to CSV
    
    @staticmethod
    def export_flagged_payments(db: Session, include_cleared: bool = False) -> str:
        # Export flagged payments (transactions with alerts or blocks) to CSV
        # Query transactions that have alerts or are affected by blocks
        query = db.query(Transaction, Alert, User.name.label('sender_name'), User.email.label('sender_email'),
                        User.name.label('recipient_name'), User.email.label('recipient_email'))\
                  .join(Alert, Transaction.id == Alert.transaction_id)\
                  .join(Account.query.filter(Account.id == Transaction.sender_id).subquery(), 
                       Transaction.sender_id == Account.id)\
                  .join(User.query.filter(User.id == Account.user_id).subquery().alias('sender_user'),
                       Account.user_id == User.id)\
                  .join(Account.query.filter(Account.id == Transaction.recipient_id).subquery().alias('recipient_account'),
                       Transaction.recipient_id == Account.id)\
                  .join(User.query.filter(User.id == Account.user_id).subquery().alias('recipient_user'),
                       Account.user_id == User.id)
        
        if not include_cleared:
            query = query.filter(Alert.cleared == False)
            
        results = query.order_by(Transaction.created_at.desc()).all()
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        headers = [
            'Transaction ID',
            'Amount',
            'Currency', 
            'Status',
            'Sender Name',
            'Sender Email',
            'Recipient Name', 
            'Recipient Email',
            'Alert Code',
            'Alert Message',
            'Alert Cleared',
            'Transaction Date',
            'Alert Date',
            'Description',
            'Reference'
        ]
        writer.writerow(headers)
        
        # Write data rows
        for transaction, alert, sender_name, sender_email, recipient_name, recipient_email in results:
            row = [
                transaction.id,
                str(transaction.amount),
                transaction.currency,
                transaction.status,
                sender_name or 'Unknown',
                sender_email or 'Unknown',
                recipient_name or 'Unknown', 
                recipient_email or 'Unknown',
                alert.code,
                alert.message,
                'Yes' if alert.cleared else 'No',
                transaction.created_at.isoformat() if transaction.created_at else '',
                alert.created_at.isoformat() if alert.created_at else '',
                transaction.description or '',
                transaction.reference or ''
            ]
            writer.writerow(row)
            
        return output.getvalue()
    
    @staticmethod
    def export_flagged_payments_simple(db: Session, include_cleared: bool = False) -> str:
        # Simplified version using separate queries - export flagged payments to CSV
        # Get alerts (optionally filtered by cleared status)
        alert_query = db.query(Alert)
        if not include_cleared:
            alert_query = alert_query.filter(Alert.cleared == False)
        
        alerts = alert_query.order_by(Alert.created_at.desc()).all()
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        headers = [
            'Transaction ID',
            'Amount',
            'Currency', 
            'Status',
            'Sender Name',
            'Sender Email',
            'Sender Account ID',
            'Recipient Name', 
            'Recipient Email',
            'Recipient Account ID',
            'Alert Code',
            'Alert Message',
            'Alert Cleared',
            'Transaction Date',
            'Alert Date',
            'Description',
            'Reference'
        ]
        writer.writerow(headers)
        
        # Write data rows
        for alert in alerts:
            # Get transaction details
            transaction = None
            if alert.transaction_id:
                transaction = db.query(Transaction).filter(Transaction.id == alert.transaction_id).first()
            
            # Get sender details
            sender_account = db.query(Account).filter(Account.id == alert.sender_account_id).first()
            sender_user = None
            if sender_account:
                sender_user = db.query(User).filter(User.id == sender_account.user_id).first()
                
            # Get recipient details  
            recipient_account = db.query(Account).filter(Account.id == alert.recipient_account_id).first()
            recipient_user = None
            if recipient_account:
                recipient_user = db.query(User).filter(User.id == recipient_account.user_id).first()
            
            row = [
                transaction.id if transaction else 'N/A',
                str(transaction.amount) if transaction else 'N/A',
                transaction.currency if transaction else 'N/A',
                transaction.status if transaction else 'N/A',
                sender_user.name if sender_user else 'Unknown',
                sender_user.email if sender_user else 'Unknown',
                alert.sender_account_id,
                recipient_user.name if recipient_user else 'Unknown',
                recipient_user.email if recipient_user else 'Unknown', 
                alert.recipient_account_id,
                alert.code,
                alert.message,
                'Yes' if alert.cleared else 'No',
                transaction.created_at.isoformat() if transaction and transaction.created_at else '',
                alert.created_at.isoformat() if alert.created_at else '',
                transaction.description if transaction else '',
                transaction.reference if transaction else ''
            ]
            writer.writerow(row)
            
        return output.getvalue()
    
    @staticmethod
    def export_active_blocks(db: Session) -> str:
        # Export currently active blocks to CSV format
        # Get active blocks (not removed)
        blocks = db.query(Block).filter(Block.removed_at.is_(None)).order_by(Block.created_at.desc()).all()
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        headers = [
            'Block ID',
            'Block Type',
            'Subject Account ID',
            'Subject User Name',
            'Subject User Email', 
            'Reason',
            'Created Date'
        ]
        writer.writerow(headers)
        
        # Write data rows
        for block in blocks:
            # Get account and user details
            account = db.query(Account).filter(Account.id == block.subject_account_id).first()
            user = None
            if account:
                user = db.query(User).filter(User.id == account.user_id).first()
            
            row = [
                block.id,
                block.block_type.value,
                block.subject_account_id,
                user.name if user else 'Unknown',
                user.email if user else 'Unknown',
                block.reason or '',
                block.created_at.isoformat() if block.created_at else ''
            ]
            writer.writerow(row)
            
        return output.getvalue()