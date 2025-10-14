import React, { useState } from "react";
import "./TransactionPanel.css";
import ApiService from "../services/api";

export default function TransactionPanel({
  onClose,
  transactionDetails,
  onUpdate,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [senderBlocked, setSenderBlocked] = useState(
    transactionDetails?.sender?.blocked || false
  );
  const [receiverBlocked, setReceiverBlocked] = useState(
    transactionDetails?.receiver?.blocked || false
  );

  // Handle blocking sender
  const handleBlockSender = async () => {
    if (!transactionDetails?.sender?.account_id) {
      setError("Sender account information not available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (senderBlocked) {
        // Unblock sender
        await ApiService.unblockAccount(
          transactionDetails.sender.account_id,
          "SENDER"
        );
        setSenderBlocked(false);
        alert(`${transactionDetails.sender.name} has been unblocked from sending payments`);
      } else {
        // Block sender
        await ApiService.blockAccount(
          transactionDetails.sender.account_id,
          "SENDER",
          `Blocked via transaction ${transactionDetails.code}`
        );
        setSenderBlocked(true);
        alert(`${transactionDetails.sender.name} has been blocked from sending payments`);
      }
      
      // Notify parent to refresh data
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error("Error blocking/unblocking sender:", err);
      setError(err.message || "Failed to update block status");
    } finally {
      setLoading(false);
    }
  };

  // Handle blocking receiver
  const handleBlockReceiver = async () => {
    if (!transactionDetails?.receiver?.account_id) {
      setError("Receiver account information not available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (receiverBlocked) {
        // Unblock receiver
        await ApiService.unblockAccount(
          transactionDetails.receiver.account_id,
          "RECIPIENT"
        );
        setReceiverBlocked(false);
        alert(`${transactionDetails.receiver.name} has been unblocked from receiving payments`);
      } else {
        // Block receiver
        await ApiService.blockAccount(
          transactionDetails.receiver.account_id,
          "RECIPIENT",
          `Blocked via transaction ${transactionDetails.code}`
        );
        setReceiverBlocked(true);
        alert(`${transactionDetails.receiver.name} has been blocked from receiving payments`);
      }
      
      // Notify parent to refresh data
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error("Error blocking/unblocking receiver:", err);
      setError(err.message || "Failed to update block status");
    } finally {
      setLoading(false);
    }
  };

  if (!transactionDetails) {
    return (
      <div className="transaction-panel">
        <p>No transaction details available</p>
        <button className="btn btn-outline" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="transaction-panel">
      <h2>Transaction Details</h2>
      
      {error && (
        <div className="error-message" style={{ marginBottom: "1rem", padding: "0.5rem", backgroundColor: "#fee", color: "#c00", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      <div className="transaction-info">
        <div className="info-row">
          <strong>Code:</strong> {transactionDetails.code}
        </div>
        <div className="info-row">
          <strong>Status:</strong> 
          <span className={`status-badge ${transactionDetails.status.toLowerCase()}`}>
            {transactionDetails.status}
          </span>
        </div>
        <div className="info-row">
          <strong>Description:</strong> {transactionDetails.description}
        </div>
        <div className="info-row">
          <strong>Time:</strong> {transactionDetails.time}
        </div>
        <div className="info-row">
          <strong>Date:</strong> {transactionDetails.date}
        </div>
        <div className="info-row">
          <strong>Amount:</strong> R{Math.abs(transactionDetails.amount).toFixed(2)} {transactionDetails.currency || "ZAR"}
        </div>
      </div>

      {/* Display alerts if any */}
      {transactionDetails.alerts && transactionDetails.alerts.length > 0 && (
        <div className="alerts-section">
          <hr className="transaction-panel-divider" />
          <h3>Alerts</h3>
          {transactionDetails.alerts.map((alert) => (
            <div key={alert.id} className={`alert-item ${alert.cleared ? 'cleared' : 'active'}`}>
              <strong>{alert.code}:</strong> {alert.message}
              {alert.cleared && <span className="cleared-badge"> (Cleared)</span>}
            </div>
          ))}
        </div>
      )}

      <hr className="transaction-panel-divider" />
      
      {/* Sender Section */}
      <div className="transaction-user-section">
        <div className="user-info">
          <strong>Sender:</strong> {transactionDetails.sender.name} ({transactionDetails.sender.email})
          {senderBlocked && <span className="blocked-badge"> BLOCKED</span>}
        </div>
        <button
          className={senderBlocked ? "unblock-btn" : "block-btn"}
          type="button"
          onClick={handleBlockSender}
          disabled={loading}
        >
          {loading ? "Processing..." : senderBlocked ? "Unblock Sender" : "Block Sender"}
        </button>
      </div>

      {/* Receiver Section */}
      <div className="transaction-user-section">
        <div className="user-info">
          <strong>Receiver:</strong> {transactionDetails.receiver.name} ({transactionDetails.receiver.email})
          {receiverBlocked && <span className="blocked-badge"> BLOCKED</span>}
        </div>
        <button
          className={receiverBlocked ? "unblock-btn" : "block-btn"}
          type="button"
          onClick={handleBlockReceiver}
          disabled={loading}
        >
          {loading ? "Processing..." : receiverBlocked ? "Unblock Receiver" : "Block Receiver"}
        </button>
      </div>

      <div className="row mt-4">
        <button className="btn btn-outline" type="button" onClick={onClose} disabled={loading}>
          Close
        </button>
      </div>
    </div>
  );
}
