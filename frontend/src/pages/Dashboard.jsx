// Dashboard page

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidePanel from "../components/SidePanel";
import TopupPanel from "../components/TopupPanel";
import Popup from '../components/Popup';
import "./Dashboard.css";
import ApiService from "../services/api";
import SSEService from "../services/sseService";

// We'll derive today's totals from the recent_payment_history returned by the backend.
const today = new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [topupPopupOpen, setTopupPopupOpen] = useState(false);

  // Closes the popup
  function onTopupPopupClose() {
    setTopupPopupOpen(false);
    // No need to reload since data is updated in real-time
  }

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsed = JSON.parse(userData);
    setUser(parsed);
    setBalance(Number(parsed.balance) || 0);

    let aborted = false;

    // Setup SSE connection for real-time updates
  const handleSSEMessage = async (event) => {
    if (!event.data) return;
    
    try {
      console.log("Dashboard: SSE message received:", event.data);
      const data = JSON.parse(event.data);
      
      // Handle keepalive pings
      if (data.type === 'ping') {
        console.log("Dashboard: Received keepalive ping");
        return;
      }
      
      // Handle balance updates
      if (data.type === 'balance_updated') {
        console.log("Dashboard: Processing balance update:", data);
        
        // Update client data to get new balance
        await loadClientData();
        
        // Also refresh payment history to show new transactions
        await loadPaymentHistory();
        
        // Show a notification to the user
        if (data.transaction_type === 'received') {
          console.log(`Received ${data.amount} from ${data.sender || 'someone'}`);
        } else if (data.transaction_type === 'sent') {
          console.log(`Sent ${data.amount} to ${data.recipient || 'someone'}`);
        } else if (data.transaction_type === 'topup') {
          console.log(`Account topped up with ${data.amount}`);
        }
      }
      
      // Handle other notification types
      else if (data.type === 'payment_update') {
        console.log("Dashboard: Processing payment update");
        await loadPaymentHistory();
      }
      
    } catch (error) {
      console.error("Dashboard: Error processing SSE message:", error);
    }
  };    const handleSSEError = (error) => {
      console.error("SSE connection error:", error);
    };

    // Separate function to load payment history
    async function loadPaymentHistory() {
      if (aborted) return;
      try {
        const hist = await ApiService.getPaymentHistory(parsed.id, 100);
        const payment_history = hist && hist.payment_history ? hist.payment_history : [];
        setUser((u) => ({ ...(u || {}), recent_payment_history: payment_history }));
        try {
          const stored2 = JSON.parse(localStorage.getItem("currentUser") || "{}");
          localStorage.setItem("currentUser", JSON.stringify({ ...stored2, recent_payment_history: payment_history }));
        } catch (e) {}
      } catch (e) {
        console.error("Payment history load failed", e);
      }
    }

    // Fetch client info and today's payments once.
    async function loadClientAndPayments() {
      if (aborted) return;
      try {
        const fresh = await ApiService.getClient(parsed.id);
        setBalance(Number(fresh.balance) || 0);
        setUser((u) => ({ ...(u || {}), ...fresh }));
        try {
          const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
          localStorage.setItem("currentUser", JSON.stringify({ ...stored, ...fresh }));
        } catch (e) {}
      } catch (e) {
        console.error("Initial client load failed", e);
      }

      await loadPaymentHistory();
    }

    // Run initial load and setup SSE
    (async () => {
      await loadClientAndPayments();
      // Setup SSE connection after initial load
      SSEService.connect(parsed.id, handleSSEMessage, handleSSEError);
    })();

    // Remove window focus and visibility listeners that cause excessive API calls
    // const onVis = () => {
    //   loadClientAndPayments();
    // };
    // window.addEventListener("focus", onVis);
    // document.addEventListener("visibilitychange", onVis);

    // Remove legacy event listeners that are causing duplicate API calls
    // const onAccountUpdated = (ev) => { ... };
    // const onPaymentHistoryUpdated = (ev) => { ... };

    return () => {
      aborted = true;
      // Temporarily disable SSE cleanup
      // SSEService.disconnect(parsed.id);
      // Remove the window event listeners cleanup since we're not adding them
      // window.removeEventListener("focus", onVis);
      // document.removeEventListener("visibilitychange", onVis);
      // window.removeEventListener('account:updated', onAccountUpdated);
      // window.removeEventListener('payment-history:updated', onPaymentHistoryUpdated);
    };
  }, [navigate]);

  // derive payments from the user's recent_payment_history; show only today's payments
  const recentPayments = (user && user.recent_payment_history) || [];
  // recent_payment_history entries expected: { date, time, type, amount, description, name }
  const paymentsToday = recentPayments.filter((p) => p.date === today);
  const creditsToday = paymentsToday.filter((p) => p.type === "Credit");
  const debitsToday = paymentsToday.filter((p) => p.type === "Debit");
  const totalCreditsToday = creditsToday.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalDebitsToday = debitsToday.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="dashboard">

      {/* Topup success popup */}
      <Popup blackText="Top up " greenText="successful!" showPopup={topupPopupOpen} setShowPopup={setTopupPopupOpen} onClose={onTopupPopupClose} />

      <div className="page-header-with-actions">
        <h1 className="page-title">Dashboard</h1>
        <div className="page-actions">
          <button className="btn top-up-btn" onClick={() => setPanelOpen(true)}>
            + Top up
          </button>
        </div>
      </div>

      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Today's Overview
      </h2>

      <div className="dashboard-cards">
        {/* Balance card - full width */}
        <div className="balance-card-full">
          <div className="card-label">Current Balance</div>
          <div className="card-value">R{Number(balance).toFixed(2)}</div>
        </div>

        {/* Credits and Debits today cards - side by side */}
        <div className="cash-flow-grid">
          <div className="cash-flow-card credit-card">
            <div className="card-label">Credits today</div>
            <div className="card-value positive">
              R{totalCreditsToday.toFixed(2)}
            </div>
            <div className="card-subtitle">{creditsToday.length} credits</div>
          </div>
          <div className="cash-flow-card debit-card">
            <div className="card-label">Debits today</div>
            <div className="card-value negative">
              R{Math.abs(totalDebitsToday).toFixed(2)}
            </div>
            <div className="card-subtitle">{debitsToday.length} debits</div>
          </div>
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
                  <td className={`amount-col ${p.type === "Credit" ? "positive" : "negative"}`}>
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
