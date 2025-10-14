import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import SidePanel from "../components/SidePanel";
import TransactionPanel from "../components/TransactionPanel";
import ApiService from "../services/api";
import { useSSE } from "../contexts/SSEContext";

export default function Admin() {
  const navigate = useNavigate();
  const { addEventListener } = useSSE();
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        
        // Check if user is admin
        if (!user.admin) {
          setError("Access denied. Admin privileges required.");
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
        setError("Invalid user session");
        setLoading(false);
      }
    } else {
      setError("Please log in to access admin panel");
      setLoading(false);
    }
  }, []);

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    if (!currentUser || !currentUser.admin) return;
    
    try {
      setLoading(true);
      const response = await ApiService.getAdminTransactions();
      setPayments(response.transactions || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (currentUser && currentUser.admin) {
      fetchTransactions();
    }
  }, [currentUser]);

  // Subscribe to SSE for real-time updates
  useEffect(() => {
    if (!currentUser || !currentUser.admin) return;

    // Listen for transaction updates, blocks, and other admin events
    const unsubscribeBalance = addEventListener("balance_updated", (data) => {
      console.log("Admin: Received balance_updated event", data);
      // Refresh transactions when any balance changes (indicates new transaction)
      fetchTransactions();
    });

    // Listen for admin-specific transaction updates
    const unsubscribeAdminTx = addEventListener("admin_transaction_update", (data) => {
      console.log("Admin: Received admin_transaction_update event", data);
      // Refresh transactions when a new transaction occurs system-wide
      fetchTransactions();
    });

    const unsubscribeBlock = addEventListener("account_blocked", (data) => {
      console.log("Admin: Received account_blocked event", data);
      // Refresh transactions to show updated block status
      fetchTransactions();
    });

    const unsubscribeUnblock = addEventListener("account_unblocked", (data) => {
      console.log("Admin: Received account_unblocked event", data);
      // Refresh transactions to show updated block status
      fetchTransactions();
    });

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribeBalance) unsubscribeBalance();
      if (unsubscribeAdminTx) unsubscribeAdminTx();
      if (unsubscribeBlock) unsubscribeBlock();
      if (unsubscribeUnblock) unsubscribeUnblock();
    };
  }, [currentUser, addEventListener]);

  const handleExport = async () => {
    if (!currentUser || !currentUser.id) {
      alert("User session not found");
      return;
    }

    try {
      const blob = await ApiService.exportFlaggedPayments(currentUser.id, false);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flagged_payments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleAdminAction = (transaction) => {
    setSelectedTransaction(transaction);
    setPanelOpen(true);
  };

  const handleTransactionUpdate = () => {
    // Refresh transactions after any admin action
    fetchTransactions();
  };

  // Calculate totals
  const succeeded = payments.filter((p) => p.status === "Succeeded");
  const flagged = payments.filter((p) => p.status === "Flagged");
  const blocked = payments.filter((p) => p.status === "Blocked");
  const totalSucceeded = succeeded.reduce((sum, p) => sum + p.amount, 0);
  const totalFlagged = flagged.reduce((sum, p) => sum + p.amount, 0);
  const totalBlocked = blocked.reduce((sum, p) => sum + p.amount, 0);

  if (error && (!currentUser || !currentUser.admin)) {
    return (
      <div className="admin-error">
        <h2>Access Denied</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="">
      <div className="page-header-with-actions">
        <h1 className="page-title">Admin Panel</h1>
        <div className="page-actions">
          <button 
            className="btn btn-outline" 
            onClick={handleExport}
            disabled={loading}
          >
            Export Flagged
          </button>
          <button 
            className="btn btn-outline" 
            onClick={fetchTransactions}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && payments.length === 0 ? (
        <div className="loading-message">Loading transactions...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="payments-cards card-grid">
            <div className="payment-card stat-card succeeded">
              <div className="card-header">Succeeded</div>
              <div className="card-value">R{totalSucceeded.toFixed(2)}</div>
              <div className="card-subtitle">{succeeded.length} records</div>
            </div>
            <div className="payment-card stat-card flagged">
              <div className="card-header">Flagged</div>
              <div className="card-value">R{totalFlagged.toFixed(2)}</div>
              <div className="card-subtitle">{flagged.length} records</div>
            </div>
            <div className="payment-card stat-card blocked">
              <div className="card-header">Blocked</div>
              <div className="card-value">R{totalBlocked.toFixed(2)}</div>
              <div className="card-subtitle">{blocked.length} records</div>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>STATUS</th>
                  <th>DESCRIPTION</th>
                  <th>TIME</th>
                  <th>DATE</th>
                  <th>SENDER</th>
                  <th>RECEIVER</th>
                  <th>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "2rem" }}>
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const statusClass =
                      p.status === "Succeeded"
                        ? "text-success"
                        : p.status === "Flagged"
                        ? "text-warning"
                        : p.status === "Blocked"
                        ? "text-danger"
                        : "";

                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleAdminAction(p)}
                        style={{ cursor: "pointer" }}
                        className="admin-table-row"
                      >
                        <td>{p.code}</td>
                        <td className={statusClass}>{p.status}</td>
                        <td>{p.description}</td>
                        <td>{p.time}</td>
                        <td>{p.date}</td>
                        <td>{p.sender.name}</td>
                        <td>{p.receiver.name}</td>
                        <td className="font-bold">
                          R{Math.abs(p.amount).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Transaction details panel */}
      {panelOpen && selectedTransaction && (
        <SidePanel title="Transaction Details" onClose={() => setPanelOpen(false)}>
          <TransactionPanel
            onClose={() => setPanelOpen(false)}
            transactionDetails={selectedTransaction}
            onUpdate={handleTransactionUpdate}
          />
        </SidePanel>
      )}
    </div>
  );
}

