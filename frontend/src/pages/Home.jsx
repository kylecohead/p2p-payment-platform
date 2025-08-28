// this is dashboard

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import ApiService from "../services/api";

export default function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const userData = localStorage.getItem("currentUser");
        if (!userData) { navigate("/login"); return; }

        const parsed = JSON.parse(userData);
        setUser(parsed);
        setBalance(Number(parsed.balance) || 0);

        let id;            // interval id
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
                        ...(JSON.parse(localStorage.getItem("currentUser") || "{}")),
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

        const onVis = () => { refresh(); schedule(); };
        window.addEventListener("focus", onVis);
        document.addEventListener("visibilitychange", onVis);

        return () => {
            aborted = true;
            clearInterval(id);
            window.removeEventListener("focus", onVis);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [navigate]);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
            </div>

            <div className="dashboard-overview">
                <div className="overview-header">
                    <h2>Today Overview</h2>
                    <button className="btn top-up-btn" onClick={() => navigate('/topup')}>
                        + Top up
                    </button>
                </div>

                <div className="overview-cards">
                    <div className="overview-card balance-card">
                        <div className="card-label">Balance</div>
                        <div className="card-value">R{Number(balance).toFixed(2)}</div>
                    </div>

                    <div className="overview-card inflow-card">
                        <div className="card-label">Cash Inflows</div>
                        <div className="card-value positive">temp</div>
                    </div>

                    <div className="overview-card outflow-card">
                        <div className="card-label">Cash Outflows</div>
                        <div className="card-value negative">temp</div>
                    </div>
                </div>
            </div>

            <div className="payments-section">
                <div className="payments-header">
                    <h2>Payments</h2>
                </div>

                <div className="payments-table-container">
                    <table className="payments-table">
                        <thead>
                            <tr>
                                <th>PERSON</th>
                                <th>ACCOUNT NUMBER</th>
                                <th>EMAIL</th>
                                <th>DATE</th>
                                <th>TIME</th>
                                <th>TOTAL</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="7" className="empty-state">
                                    No payment history available
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
