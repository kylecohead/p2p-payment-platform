// Dashboard page

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import ApiService from "../services/api";

// We'll derive today's totals from the recent_payment_history returned by the backend.
const today = new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsed = JSON.parse(userData);
    setUser(parsed);
    setBalance(Number(parsed.balance) || 0);

    let id; // interval id
    let aborted = false;

    async function refresh() {
      if (aborted) return;
      try {
        const fresh = await ApiService.getClient(parsed.id);
        setBalance(Number(fresh.balance) || 0);
        setUser((u) => ({ ...(u || {}), ...fresh })); // <- safe spread
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("currentUser") || "{}"),
            ...fresh,
          })
        );
      } catch (e) {
        console.error("Balance refresh failed", e);
      }
    }

    function schedule() {
      const ms = document.visibilityState === "visible" ? 1000 : 5000;
      clearInterval(id);
      id = setInterval(refresh, ms);
    }

    // kick it off
    refresh();
    schedule();

    const onVis = () => {
      refresh();
      schedule();
    };
    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      aborted = true;
      clearInterval(id);
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [navigate]);

  // derive recent payments and today's stats from the user's recent_payment_history
  const recentPayments = (user && user.recent_payment_history) || [];
  // recent_payment_history entries follow the backend shape: { date, time, type, amount, description, name }
  const paymentsToday = recentPayments.filter((p) => p.date === today);
  const creditsToday = paymentsToday.filter((p) => p.type === "Credit");
  const debitsToday = paymentsToday.filter((p) => p.type === "Debit");
  const totalCreditsToday = creditsToday.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalDebitsToday = debitsToday.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="dashboard">
      <div className="page-header-with-actions">
        <h1 className="page-title">Dashboard</h1>
        <div className="page-actions">
          <button className="btn top-up-btn" onClick={() => navigate("/topup")}>
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

      {/* Recent payments preview (up to 5) */}
      <div className="recent-payments">
        <h3>Recent payments</h3>
        {recentPayments.length === 0 ? (
          <div className="empty">No recent payments</div>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Party</th>
                <th>Description</th>
                <th className="amount-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.slice(0, 5).map((p) => (
                <tr key={p.transaction_id || `${p.date}-${p.time}-${p.amount}`}>
                  <td>{p.date}</td>
                  <td>{p.time}</td>
                  <td>{p.name}</td>
                  <td>{p.description}</td>
                  <td className={`amount-col ${p.type === "Credit" ? "positive" : "negative"}`}>
                    {p.type === "Credit" ? 
                      `R${Number(p.amount).toFixed(2)}` : 
                      `R${Number(p.amount).toFixed(2)}`}
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
