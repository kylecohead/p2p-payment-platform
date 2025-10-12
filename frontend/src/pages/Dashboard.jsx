// Dashboard page

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SidePanel from "../components/SidePanel";
import TopupPanel from "../components/TopupPanel";
import Popup from "../components/Popup";
import SparkleOverlay from "../components/SparkleOverlay";
import "./Dashboard.css";
import ApiService from "../services/api";
import { useSSE } from "../contexts/SSEContext";

// We'll derive today's totals from the recent_payment_history returned by the backend.
const today = new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [topupPopupOpen, setTopupPopupOpen] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const { addEventListener } = useSSE();

  // Closes the popup
  function onTopupPopupClose() {
    setTopupPopupOpen(false);
    // No need to reload since data is updated in real-time
  }

  // Memoized SSE message handler
  const handleSSEMessage = useCallback(async (data) => {
    if (!data) return;
    
    try {
      // Handle keepalive pings
      if (data.type === 'ping') {
        return;
      }
      
      // Handle shutdown signal
      if (data.type === 'shutdown') {
        return;
      }
      
      // Handle balance updates
      if (data.type === 'balance_updated') {
        // Update balance immediately from the notification
        if (data.data && typeof data.data.new_balance === 'number') {
          setBalance(data.data.new_balance);
        }
        
        // Trigger data reload
        setReloadTrigger(prev => prev + 1);
        
        // Show a notification to the user
        if (data.data.transaction_type === 'received') {
          console.log(`Received ${data.data.amount} from ${data.data.sender || 'someone'}`);
        } else if (data.data.transaction_type === 'sent') {
          console.log(`Sent ${data.data.amount} to ${data.data.recipient || 'someone'}`);
        } else if (data.data.transaction_type === 'topup') {
          console.log(`Account topped up with ${data.data.amount}`);
        }
      }
      
      // Handle other notification types
      else if (data.type === 'payment_update') {
        setReloadTrigger(prev => prev + 1);
      }
      
    } catch (error) {
      console.error("Dashboard: Error processing SSE message:", error);
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsed = JSON.parse(userData);
    setUser(parsed);
    setBalance(Number(parsed.balance) || 0);
  }, [navigate]);

  // SSE listeners effect  
  useEffect(() => {
    // Setup global SSE event listeners and store cleanup functions
    const balanceCleanup = addEventListener('balance_updated', handleSSEMessage);
    const paymentCleanup = addEventListener('payment_update', handleSSEMessage);

    return () => {
      // Clean up event listeners
      if (balanceCleanup) balanceCleanup();
      if (paymentCleanup) paymentCleanup();
    };
  }, [addEventListener, handleSSEMessage]);

  // Data loading effect (triggered by reloadTrigger)
  useEffect(() => {
    const parsed = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (!parsed || !parsed.id) return;

    let aborted = false;

    // Separate function to load payment history
    async function loadPaymentHistory() {
      if (aborted) return;
      try {
        const hist = await ApiService.getPaymentHistory(parsed.id, 100);
        const payment_history = hist && hist.payment_history ? hist.payment_history : [];
        
        if (!aborted) {
          setUser((u) => ({ ...(u || {}), recent_payment_history: payment_history }));
          try {
            const stored2 = JSON.parse(localStorage.getItem("currentUser") || "{}");
            localStorage.setItem("currentUser", JSON.stringify({ ...stored2, recent_payment_history: payment_history }));
          } catch (e) {}
        }
      } catch (e) {
        console.error("Payment history load failed", e);
      }
    }

    // Fetch client info and today's payments once.
    async function loadClientAndPayments() {
      if (aborted) return;
      try {
        const fresh = await ApiService.getClient(parsed.id);
        
        if (!aborted) {
          setBalance(Number(fresh.balance) || 0);
          setUser((u) => ({ ...(u || {}), ...fresh }));
          try {
            const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
            localStorage.setItem("currentUser", JSON.stringify({ ...stored, ...fresh }));
          } catch (e) {}
        }
      } catch (e) {
        console.error("Initial client load failed", e);
      }

      await loadPaymentHistory();
    }

    // Run data loading
    loadClientAndPayments();

    return () => {
      aborted = true;
    };
  }, [reloadTrigger]); // Trigger reload when SSE messages are received

  // derive payments from the user's recent_payment_history; show only today's payments
  const recentPayments = (user && user.recent_payment_history) || [];
  // recent_payment_history entries expected: { date, time, type, amount, description, name }
  const paymentsToday = recentPayments.filter((p) => p.date === today);
  const creditsToday = paymentsToday.filter((p) => p.type === "Credit");
  const debitsToday = paymentsToday.filter((p) => p.type === "Debit");
  const totalCreditsToday = creditsToday.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );
  const totalDebitsToday = debitsToday.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  return (
    <div className="dashboard">
      {/* Topup success popup */}
      <SparkleOverlay show={topupPopupOpen} />
      <Popup
        blackText="Top up "
        greenText="successful!"
        showPopup={topupPopupOpen}
        setShowPopup={setTopupPopupOpen}
        onClose={onTopupPopupClose}
      />

      <div className="page-header-with-actions">
        <h1 className="page-title">Dashboard</h1>
        <div className="page-actions">
          <button className="btn top-up-btn" onClick={() => setPanelOpen(true)}>
            + Top up
          </button>
        </div>
      </div>

      <div className="dashboard-cards">
        {/* Balance card - spans full width */}
        <div className="balance-card-full">
          <div className="card-label">Current Balance</div>
          <div className="card-value">R{Number(balance).toFixed(2)}</div>
        </div>

        {/* Credits and Debits cards - grid items */}
        <div className="cash-flow-card credit-card">
          <div className="card-label">Money In</div>
          <div className="card-value positive">
            +R{totalCreditsToday.toFixed(2)}
          </div>
          <div className="card-subtitle">
            {creditsToday.length} transactions
          </div>
        </div>

        <div className="cash-flow-card debit-card">
          <div className="card-label">Money Out</div>
          <div className="card-value negative">
            -R{Math.abs(totalDebitsToday).toFixed(2)}
          </div>
          <div className="card-subtitle">{debitsToday.length} transactions</div>
        </div>

        {/* Net flow card */}
        <div className="cash-flow-card net-card">
          <div className="card-label">Net Today</div>
          <div
            className={`card-value ${
              totalCreditsToday - Math.abs(totalDebitsToday) >= 0
                ? "positive"
                : "negative"
            }`}
          >
            {totalCreditsToday - Math.abs(totalDebitsToday) >= 0 ? "+" : ""}R
            {(totalCreditsToday - Math.abs(totalDebitsToday)).toFixed(2)}
          </div>
          <div className="card-subtitle">Today's net flow</div>
        </div>
      </div>

      {/* Side panel for Topup */}
      {panelOpen && (
        <SidePanel title="Top up" onClose={() => setPanelOpen(false)}>
          <TopupPanel
            onCancel={() => setPanelOpen(false)}
            onSuccess={(result) => {
              setPanelOpen(false);
              setTopupPopupOpen(true);
              
              // Update local state with fresh data from localStorage and topup result
              try {
                const updatedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
                
                // Use the new_balance from the topup result if available
                const newBalance = result?.result?.new_balance || updatedUser.balance;
                
                setUser(updatedUser);
                setBalance(Number(newBalance) || 0);
              } catch (e) {
                console.error("Error updating local state after topup:", e);
              }
            }}
          />
        </SidePanel>
      )}

      {/* Today's payments */}
      <div className="today-payments">
        <h3>Today's transactions</h3>
        {paymentsToday.length === 0 ? (
          <div className="empty">No transactions today</div>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Party</th>
                <th>Description</th>
                <th className="amount-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paymentsToday.map((p) => (
                <tr key={p.transaction_id || `${p.date}-${p.time}-${p.amount}`}>
                  <td>{p.time}</td>
                  <td>{p.name}</td>
                  <td>{p.description}</td>
                  <td
                    className={`amount-col ${
                      p.type === "Credit" ? "positive" : "negative"
                    }`}
                  >
                    R{Number(p.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
