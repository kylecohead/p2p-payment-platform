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
            <div className="page-header-with-actions">
                <h1 className="page-title">Dashboard</h1>
                <div className="page-actions">
                    <button className="btn top-up-btn" onClick={() => navigate('/topup')}>
                        + Top up
                    </button>
                </div>
            </div>

            <h2 style={{textAlign: 'center', marginBottom: '1.5rem'}}>Today's Overview</h2>

            <div className="overview-cards card-grid">
                <div className="overview-card stat-card balance-card">
                    <div className="card-label">Balance</div>
                    <div className="card-value">R{Number(balance).toFixed(2)}</div>
                </div>

                <div className="overview-card stat-card inflow-card">
                    <div className="card-label">Cash Inflows</div>
                    <div className="card-value positive">temp</div>
                </div>

                <div className="overview-card stat-card outflow-card">
                    <div className="card-label">Cash Outflows</div>
                    <div className="card-value negative">temp</div>
                </div>
            </div>

            {/* Payments table moved to /payments page */}
        </div>
    );
}
