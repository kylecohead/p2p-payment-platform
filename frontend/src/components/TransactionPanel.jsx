import React, { useState } from "react";

export default function TransactionPanel({
  onClose,
  onBlockSender,
  onBlockReceiver,
}) {
  // Hardcoded transaction details for now
  const transaction = {
    id: "TX123456",
    sender: {
      name: "SJ",
      email: "sj@gmail.com",
    },
    receiver: {
      name: "Kyle",
      email: "kyle@gmail.com",
    },
    amount: 42.5,
    currency: "ZAR",
    date: "2024-06-01 14:23",
    description: "Lunch payment",
    status: "Completed",
  };

  const [blocked, setBlocked] = useState(null);

  const handleBlockSender = () => {
    setBlocked("sender");
    onBlockSender?.(transaction.sender);
  };

  const handleBlockReceiver = () => {
    setBlocked("receiver");
    onBlockReceiver?.(transaction.receiver);
  };

  return (
    <div>
      <h2>Transaction Details</h2>
      <div>
        <strong>ID:</strong> {transaction.id}
      </div>
      <div>
        <strong>Date:</strong> {transaction.date}
      </div>
      <div>
        <strong>Status:</strong> {transaction.status}
      </div>
      <div>
        <strong>Amount:</strong> R{transaction.amount} {transaction.currency}
      </div>
      <div>
        <strong>Description:</strong> {transaction.description}
      </div>
      <hr />
      <div>
        <strong>Sender:</strong> {transaction.sender.name} (
        {transaction.sender.email})
      </div>
      <div>
        <strong>Receiver:</strong> {transaction.receiver.name} (
        {transaction.receiver.email})
      </div>
      <div className="row mt-4">
        <button
          className="btn btn-danger"
          type="button"
          onClick={handleBlockSender}
          disabled={blocked === "sender"}
        >
          {blocked === "sender" ? "Sender Blocked" : "Block Sender"}
        </button>
        <button
          className="btn btn-danger"
          type="button"
          onClick={handleBlockReceiver}
          disabled={blocked === "receiver"}
        >
          {blocked === "receiver" ? "Receiver Blocked" : "Block Receiver"}
        </button>
        <button className="btn btn-outline" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
