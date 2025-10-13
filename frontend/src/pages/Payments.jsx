import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidePanel from "../components/SidePanel";
import SendPanel from "../components/SendPanel";
import Popup from "../components/Popup";
import SparkleOverlay from "../components/SparkleOverlay";
import "./Payments.css";
import ApiService from "../services/api";
import { useSSE } from "../contexts/SSEContext";

export default function Payments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [sendPopupOpen, setSendPopupOpen] = useState(false);
  const [sortBy, setSortBy] = useState("date_time");
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" or "desc"
  const { addEventListener } = useSSE();

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem("currentUser"));
      if (!userData) {
        navigate("/login");
        return;
      }

      console.log("Payments: Fetching payment history...");
      const response = await ApiService.getPaymentHistory(userData.id);
      setPayments(response.payment_history || []);
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Failed to fetch payment history:", err);
      setError("Failed to load payment history");
      setPayments([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, [navigate]);

  // Set up real-time updates for payments
  useEffect(() => {
    console.log("Payments: Setting up real-time payment updates");
    
    const handleBalanceUpdate = async (data) => {
      console.log("Payments: Received balance update, refreshing payment history", data);
      await fetchPaymentHistory();
    };

    const handlePaymentUpdate = async (data) => {
      console.log("Payments: Received payment update, refreshing payment history", data);
      await fetchPaymentHistory();
    };

    // Subscribe to balance and payment updates
    const unsubscribeBalance = addEventListener('balance_updated', handleBalanceUpdate);
    const unsubscribePayment = addEventListener('payment_update', handlePaymentUpdate);

    console.log("Payments: Event listeners set up");

    // Cleanup subscriptions
    return () => {
      console.log("Payments: Cleaning up event listeners");
      unsubscribeBalance();
      unsubscribePayment();
    };
  }, [addEventListener]);

  // Closes the popup and refreshes data (no page reload needed - real-time updates)
  function onSendPopupClose() {
    setSendPopupOpen(false);
    // No need to reload page - real-time updates will handle it
  }

  const handleNewPayment = () => {
    setPanelOpen(true);
  };

  // Sorting logic
  function getSortedPayments() {
    const sorted = [...payments];
    sorted.sort((a, b) => {
      if (sortBy === "date_time") {
        const aDT = new Date(`${a.date}T${a.time}`);
        const bDT = new Date(`${b.date}T${b.time}`);
        return sortOrder === "asc" ? aDT - bDT : bDT - aDT;
      }
      if (sortBy === "amount") {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortBy === "name") {
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        if (aName < bName) return sortOrder === "asc" ? -1 : 1;
        if (aName > bName) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
      return 0;
    });
    return sorted;
  }

  const sortedPayments = getSortedPayments();

  // Calculate totals
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const credits = payments.filter((p) => p.type === "Credit");
  const debits = payments.filter((p) => p.type === "Debit");
  const totalCredits = credits.reduce((sum, p) => sum + p.amount, 0);
  const totalDebits = debits.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="payments-page">
      {/* Send success popup */}
      <SparkleOverlay show={sendPopupOpen} />
      <Popup
        blackText="Payment "
        greenText="successful!"
        showPopup={sendPopupOpen}
        setShowPopup={setSendPopupOpen}
        onClose={onSendPopupClose}
      />

      <div className="page-header-with-actions">
        <h1 className="page-title">Payments</h1>
        <div className="page-actions">
          <button className="btn" onClick={handleNewPayment}>
            + New payment
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          Loading payment history...
        </div>
      ) : error ? (
        <div
          className="text-danger"
          style={{ textAlign: "center", padding: "2rem" }}
        >
          {error}
        </div>
      ) : (
        <>
          <div className="payments-cards card-grid">
            <div className="payment-card stat-card">
              <div className="card-header">All payments</div>
              <div className="card-value">R{totalAmount.toFixed(2)}</div>
              <div className="card-subtitle">{payments.length} records</div>
            </div>
            <div className="payment-card stat-card credit">
              <div className="card-header">Credits</div>
              <div className="card-value">R{totalCredits.toFixed(2)}</div>
              <div className="card-subtitle">{credits.length} records</div>
            </div>
            <div className="payment-card stat-card debit">
              <div className="card-header">Debits</div>
              <div className="card-value">
                R{Math.abs(totalDebits).toFixed(2)}
              </div>
              <div className="card-subtitle">{debits.length} records</div>
            </div>
          </div>

          {/* Sort buttons */}
          <div className="payments-sort-buttons">
            <button
              className={`sort-btn${sortBy === "date_time" ? " active" : ""}`}
              onClick={() =>
                setSortBy("date_time") ||
                setSortOrder(sortBy === "date_time" && sortOrder === "desc" ? "asc" : "desc")
              }
            >
              Date/Time
              {sortBy === "date_time" ? (
                <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
              ) : null}
            </button>
            <button
              className={`sort-btn${sortBy === "amount" ? " active" : ""}`}
              onClick={() =>
                setSortBy("amount") ||
                setSortOrder(sortBy === "amount" && sortOrder === "desc" ? "asc" : "desc")
              }
            >
              Amount
              {sortBy === "amount" ? (
                <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
              ) : null}
            </button>
            <button
              className={`sort-btn${sortBy === "name" ? " active" : ""}`}
              onClick={() =>
                setSortBy("name") ||
                setSortOrder(sortBy === "name" && sortOrder === "desc" ? "asc" : "desc")
              }
            >
              Name
              {sortBy === "name" ? (
                <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
              ) : null}
            </button>
          </div>

          <div className="payments-table-container">
            {payments.length === 0 ? (
              <div
                className="text-center text-muted"
                style={{ padding: "3rem" }}
              >
                No payment history yet. Make your first payment to see it here!
              </div>
            ) : (
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>CODE</th>
                    <th>TYPE</th>
                    <th>DESCRIPTION</th>
                    <th>TIME</th>
                    <th>DATE</th>
                    <th>NAME</th>
                    <th>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPayments.map((p, idx) => (
                    <tr key={p.code || idx}>
                      <td>{p.code}</td>
                      <td>{p.type}</td>
                      <td>{p.description}</td>
                      <td>{p.time}</td>
                      <td>{p.date}</td>
                      <td>{p.name}</td>
                      <td
                        className={`font-bold ${
                          p.amount < 0 ? "text-danger" : "text-success"
                        }`}
                      >
                        {p.amount < 0 ? "-" : ""}R
                        {Math.abs(p.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {panelOpen && (
        <SidePanel title="New payment" onClose={() => setPanelOpen(false)}>
          <SendPanel
            onCancel={() => setPanelOpen(false)}
            onSuccess={() => {
              setPanelOpen(false);
              setSendPopupOpen(true);
            }}
          />
        </SidePanel>
      )}
    </div>
  );
}
