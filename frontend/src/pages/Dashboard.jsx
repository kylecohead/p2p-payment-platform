// Dashboard page

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidePanel from "../components/SidePanel";
import TopupPanel from "../components/TopupPanel";
import Popup from "../components/Popup";
import SparkleOverlay from "../components/SparkleOverlay";
import "./Dashboard.css";
import ApiService from "../services/api";

// We'll derive today's totals from the recent_payment_history returned by the backend.
const today = new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [topupPopupOpen, setTopupPopupOpen] = useState(false);

  // Polling for balance updates
  const POLLING_INTERVAL = 2500; // 5 seconds

  // Closes the popup and navigates to /dashboard
  function onTopupPopupClose() {
    setTopupPopupOpen(false);
    window.location.reload();
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

    // Fetch client info and today's payments once.
    async function loadClientAndPayments() {
      if (aborted) return;
      try {
        const fresh = await ApiService.getClient(parsed.id);
        setBalance(Number(fresh.balance) || 0);
        setUser((u) => ({ ...(u || {}), ...fresh }));
        try {
          const stored = JSON.parse(
            localStorage.getItem("currentUser") || "{}"
          );
          localStorage.setItem(
            "currentUser",
            JSON.stringify({ ...stored, ...fresh })
          );
        } catch (e) {}
      } catch (e) {
        console.error("Initial client load failed", e);
      }

      try {
        const hist = await ApiService.getPaymentHistory(parsed.id, 100);
        const payment_history =
          hist && hist.payment_history ? hist.payment_history : [];
        setUser((u) => ({
          ...(u || {}),
          recent_payment_history: payment_history,
        }));
        try {
          const stored2 = JSON.parse(
            localStorage.getItem("currentUser") || "{}"
          );
          localStorage.setItem(
            "currentUser",
            JSON.stringify({
              ...stored2,
              recent_payment_history: payment_history,
            })
          );
        } catch (e) {}
      } catch (e) {
        console.error("Payment history load failed", e);
      }
    }

    // run initial load and also when window regains focus or visibility changes
    (async () => {
      await loadClientAndPayments();
    })();

    // Set up polling for balance and payment history updates
    const pollingInterval = setInterval(async () => {
      if (aborted) return;
      try {
        // Fetch fresh client data including balance
        const fresh = await ApiService.getClient(parsed.id);
        setBalance(Number(fresh.balance) || 0);
        setUser((u) => ({ ...(u || {}), ...fresh }));

        // Update localStorage with fresh data
        try {
          const stored = JSON.parse(
            localStorage.getItem("currentUser") || "{}"
          );
          localStorage.setItem(
            "currentUser",
            JSON.stringify({ ...stored, ...fresh })
          );
        } catch (e) {}

        // Fetch updated payment history
        const hist = await ApiService.getPaymentHistory(parsed.id, 100);
        const payment_history =
          hist && hist.payment_history ? hist.payment_history : [];
        setUser((u) => ({
          ...(u || {}),
          recent_payment_history: payment_history,
        }));

        // Update localStorage with fresh payment history
        try {
          const stored2 = JSON.parse(
            localStorage.getItem("currentUser") || "{}"
          );
          localStorage.setItem(
            "currentUser",
            JSON.stringify({
              ...stored2,
              recent_payment_history: payment_history,
            })
          );
        } catch (e) {}
      } catch (e) {
        console.error("Polling update failed", e);
      }
    }, POLLING_INTERVAL);

    const onVis = () => {
      loadClientAndPayments();
    };
    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);
    // Listen for account updates (fired after send/topup/getClient)
    const onAccountUpdated = (ev) => {
      try {
        const parsed = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (!parsed || !parsed.id) return;
        const updatedClientId = ev?.detail?.clientId;
        // If event doesn't include clientId, always proceed; otherwise only proceed for matching id
        if (updatedClientId && Number(updatedClientId) !== Number(parsed.id))
          return;

        // If the event payload includes recent_payment_history or new_balance, apply it immediately
        const payloadData = ev?.detail?.data;
        if (payloadData) {
          if (payloadData.recent_payment_history) {
            setUser((u) => ({
              ...(u || {}),
              recent_payment_history: payloadData.recent_payment_history,
            }));
            try {
              const stored2 = JSON.parse(
                localStorage.getItem("currentUser") || "{}"
              );
              localStorage.setItem(
                "currentUser",
                JSON.stringify({
                  ...stored2,
                  recent_payment_history: payloadData.recent_payment_history,
                })
              );
            } catch (e) {}
          }
          if (payloadData.new_balance !== undefined) {
            setBalance(Number(payloadData.new_balance) || 0);
          }
        }

        // Reconcile with server in background to ensure full, consistent view
        loadClientAndPayments();
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener("account:updated", onAccountUpdated);
    const onPaymentHistoryUpdated = (ev) => {
      try {
        const parsed = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (!parsed || !parsed.id) return;
        const updatedClientId = ev?.detail?.clientId;
        if (updatedClientId && Number(updatedClientId) !== Number(parsed.id))
          return;
        const payment_history = ev?.detail?.payment_history;
        if (payment_history) {
          setUser((u) => ({
            ...(u || {}),
            recent_payment_history: payment_history,
          }));
          try {
            const stored2 = JSON.parse(
              localStorage.getItem("currentUser") || "{}"
            );
            localStorage.setItem(
              "currentUser",
              JSON.stringify({
                ...stored2,
                recent_payment_history: payment_history,
              })
            );
          } catch (e) {}
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener("payment-history:updated", onPaymentHistoryUpdated);

    return () => {
      aborted = true;
      clearInterval(pollingInterval);
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("account:updated", onAccountUpdated);
      window.removeEventListener(
        "payment-history:updated",
        onPaymentHistoryUpdated
      );
    };
  }, [navigate]);

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
            onSuccess={() => {
              setPanelOpen(false);
              setTopupPopupOpen(true);
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
