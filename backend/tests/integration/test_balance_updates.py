#!/usr/bin/env python3
"""
Test script to verify that account balances are updated correctly
when sending and receiving money.
"""

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from src.config.database import DB_URL
from src.models.user import User
from src.models.account import Account
from src.models.transaction import Transaction
from decimal import Decimal
import sys

def test_balance_updates():
    """Test that balance updates work correctly."""
    # Create database session
    if not DB_URL:
        print("Error: DATABASE_URL not found in environment")
        return False
        
    engine = create_engine(DB_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("=== Testing Balance Updates ===")
        
        # Find two users to test with
        users = db.query(User).limit(2).all()
        if len(users) < 2:
            print("Error: Need at least 2 users in the database to test transfers")
            return False
            
        user1, user2 = users[0], users[1]
        print(f"User 1: {user1.name} ({user1.email})")
        print(f"User 2: {user2.name} ({user2.email})")
        
        # Get their accounts
        account1 = db.query(Account).filter(Account.user_id == user1.id).first()
        account2 = db.query(Account).filter(Account.user_id == user2.id).first()
        
        if not account1 or not account2:
            print("Error: Both users need accounts to test transfers")
            return False
            
        print(f"Account 1 ID: {account1.id} (User ID: {user1.id})")
        print(f"Account 2 ID: {account2.id} (User ID: {user2.id})")
            
        # Record initial balances
        initial_balance1 = account1.balance or Decimal('0')
        initial_balance2 = account2.balance or Decimal('0')
        
        print(f"\nInitial balances:")
        print(f"  {user1.name}: R{initial_balance1}")
        print(f"  {user2.name}: R{initial_balance2}")
        
        # Check recent transactions to see if balances are being updated
        recent_transactions = (db.query(Transaction)
                             .filter(
                                 (Transaction.sender_id.in_([account1.id, account2.id])) |
                                 (Transaction.recipient_id.in_([account1.id, account2.id]))
                             )
                             .order_by(Transaction.created_at.desc())
                             .limit(5)
                             .all())
        
        print(f"\nRecent transactions involving these accounts:")
        if not recent_transactions:
            print("  No recent transactions found")
            
            # Let's check if there are ANY transactions in the system
            all_transactions = db.query(Transaction).limit(10).all()
            if all_transactions:
                print(f"  However, found {len(all_transactions)} transactions in the system:")
                for tx in all_transactions:
                    print(f"    TX ID {tx.id}: sender_id={tx.sender_id}, recipient_id={tx.recipient_id}, amount=R{tx.amount}")
            else:
                print("  No transactions found in the entire system")
        else:
            for tx in recent_transactions:
                sender_acc = db.query(Account).filter(Account.id == tx.sender_id).first()
                recipient_acc = db.query(Account).filter(Account.id == tx.recipient_id).first()
                sender_user = db.query(User).filter(User.id == sender_acc.user_id).first() if sender_acc else None
                recipient_user = db.query(User).filter(User.id == recipient_acc.user_id).first() if recipient_acc else None
                
                print(f"  {tx.created_at}: {sender_user.name if sender_user else 'Unknown'} -> "
                      f"{recipient_user.name if recipient_user else 'Unknown'} "
                      f"R{tx.amount} ({tx.status})")
        
        print(f"\nAnalyzing balance consistency...")
        
        # Let's check all accounts in the system first
        all_accounts = db.query(Account).all()
        print(f"\nAll accounts in system:")
        for acc in all_accounts:
            user = db.query(User).filter(User.id == acc.user_id).first()
            print(f"  Account ID {acc.id}: {user.name if user else 'Unknown'} (User ID {acc.user_id}) - Balance: R{acc.balance}")
        
        # Calculate what the balance should be based on transactions
        # For user1's account
        sent_by_user1 = (db.query(Transaction)
                         .filter(Transaction.sender_id == account1.id)
                         .filter(Transaction.status == 'completed')
                         .all())
        
        received_by_user1 = (db.query(Transaction)
                            .filter(Transaction.recipient_id == account1.id)
                            .filter(Transaction.status == 'completed')
                            .all())
        
        total_sent_1 = sum(tx.amount for tx in sent_by_user1)
        total_received_1 = sum(tx.amount for tx in received_by_user1)
        
        print(f"{user1.name} transaction summary:")
        print(f"  Total sent: R{total_sent_1}")
        print(f"  Total received: R{total_received_1}")
        print(f"  Current balance: R{account1.balance}")
        
        # For user2's account
        sent_by_user2 = (db.query(Transaction)
                         .filter(Transaction.sender_id == account2.id)
                         .filter(Transaction.status == 'completed')
                         .all())
        
        received_by_user2 = (db.query(Transaction)
                            .filter(Transaction.recipient_id == account2.id)
                            .filter(Transaction.status == 'completed')
                            .all())
        
        total_sent_2 = sum(tx.amount for tx in sent_by_user2)
        total_received_2 = sum(tx.amount for tx in received_by_user2)
        
        print(f"\n{user2.name} transaction summary:")
        print(f"  Total sent: R{total_sent_2}")
        print(f"  Total received: R{total_received_2}")
        print(f"  Current balance: R{account2.balance}")
        
        print(f"\n=== Test Complete ===")
        return True
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_balance_updates()