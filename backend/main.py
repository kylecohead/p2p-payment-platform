from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models.clients import Client
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

app = FastAPI()

# Allow CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://100.70.151.74:*", "http://localhost:*", "*"],  # Allow Tailscale IP and localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class ClientLogin(BaseModel):
    email: str
    password: str

class ClientResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    balance: float

class TransactionRequest(BaseModel):
    amount: float
    recipient_email: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Waluigi Backend API"}

@app.post("/api/login")
def login(login_data: ClientLogin, db: Session = Depends(get_db)):
    # Simple login - find client by email (password validation would be added later)
    client = db.query(Client).filter(Client.email == login_data.email).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    balance_value = getattr(client, 'balance', 0)
    return {
        "id": client.id,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "balance": float(balance_value) if balance_value is not None else 0.0
    }

@app.get("/api/client/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    balance_value = getattr(client, 'balance', 0)
    return {
        "id": client.id,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "balance": float(balance_value) if balance_value is not None else 0.0
    }

@app.post("/api/topup/{client_id}")
def topup_balance(client_id: int, transaction: TransactionRequest, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    current_balance = getattr(client, 'balance', Decimal('0')) or Decimal('0')
    new_balance = current_balance + Decimal(str(transaction.amount))
    setattr(client, 'balance', new_balance)
    db.commit()
    db.refresh(client)
    
    balance_value = getattr(client, 'balance', 0)
    return {
        "message": f"Successfully topped up {transaction.amount}",
        "new_balance": float(balance_value) if balance_value is not None else 0.0
    }

@app.post("/api/send/{client_id}")
def send_money(client_id: int, transaction: TransactionRequest, db: Session = Depends(get_db)):
    if not transaction.recipient_email:
        raise HTTPException(status_code=400, detail="Recipient email required")
    
    # Get sender
    sender = db.query(Client).filter(Client.id == client_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    
    # Get recipient
    recipient = db.query(Client).filter(Client.email == transaction.recipient_email).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Check balance
    sender_balance = getattr(sender, 'balance', Decimal('0')) or Decimal('0')
    transaction_amount = Decimal(str(transaction.amount))
    
    if sender_balance < transaction_amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Transfer money
    new_sender_balance = sender_balance - transaction_amount
    recipient_balance = getattr(recipient, 'balance', Decimal('0')) or Decimal('0')
    new_recipient_balance = recipient_balance + transaction_amount
    
    setattr(sender, 'balance', new_sender_balance)
    setattr(recipient, 'balance', new_recipient_balance)
    
    db.commit()
    db.refresh(sender)
    db.refresh(recipient)
    
    sender_balance_value = getattr(sender, 'balance', 0)
    return {
        "message": f"Successfully sent {transaction.amount} to {recipient.name}",
        "new_balance": float(sender_balance_value) if sender_balance_value is not None else 0.0
    }

if __name__ == "__main__":
    import uvicorn
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    
    print(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
