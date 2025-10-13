import React from "react";
import "./TransactionPanel.css";

export default function TransactionPanel({
  onClose,
  onBlockSender,
  onBlockReceiver,
  transactionDetails,
}) {
  // Updated hardcoded transaction details
  const transaction = {
    code: "TX123456",
    status: "Flagged",
    description: "Lunch payment",
    time: "14:23",
    date: "2024-06-01",
    name: "SJ",
    amount: 42.5,
    sender: {
      name: "SJ",
      email: "sj@gmail.com",
      blocked: false,
    },
    receiver: {
      name: "Kyle",
      email: "kyle@gmail.com",
      blocked: true,
    },
    currency: "ZAR",
  };

  const handleBlockSender = () => {
    // Backend team
  };

  const handleBlockReceiver = () => {
    // Backend team
  };

  return (
    <div className="transaction-panel">
      <h2>Transaction Details</h2>
      <div>
        <strong>Code:</strong> {transactionDetails.code}
      </div>
      <div>
        <strong>Status:</strong> {transactionDetails.status}
      </div>
      <div>
        <strong>Description:</strong> {transactionDetails.description}
      </div>
      <div>
        <strong>Time:</strong> {transactionDetails.time}
      </div>
      <div>
        <strong>Date:</strong> {transactionDetails.date}
      </div>
      <div>
        <strong>Name:</strong> {transactionDetails.name}
      </div>
      <div>
        <strong>Amount:</strong> R{transactionDetails.amount} {transaction.currency}
      </div>
      <hr className="transaction-panel-divider" />
        <div className="transaction-user-section">
          <div>
            <strong>Sender:</strong> {transaction.sender.name} (
            {transaction.sender.email})
          </div>
          <button
            className={
              transaction.sender.blocked
                ? "unblock-btn"
                : "block-btn"
            }
            type="button"
            onClick={handleBlockSender}
          >
            {transaction.sender.blocked ? "Unblock User" : "Block User"}
          </button>
        </div>
        <div className="transaction-user-section">
          <div>
            <strong>Receiver:</strong> {transaction.receiver.name} (
            {transaction.receiver.email})
          </div>
          <button
            className={
              transaction.receiver.blocked
                ? "unblock-btn"
                : "block-btn"
            }
            type="button"
            onClick={handleBlockReceiver}
          >
            {transaction.receiver.blocked ? "Unblock User" : "Block User"}
          </button>
        </div>
      <div className="row mt-4">
        <button className="btn btn-outline" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
