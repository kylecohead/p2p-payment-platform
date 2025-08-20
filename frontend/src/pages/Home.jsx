import React, { useState, useEffect } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
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

    const handleLogout = () => {
        localStorage.removeItem("currentUser");
        navigate("/login");
    };
    const handleSend = () => navigate("/Send");
    const handleTopup = () => navigate("/Topup");

    return (
        <div className="home">
            <h2>Home</h2>
            <div className="account">
        <span className="account-info">
          Logged in as: {user?.name || "Loading..."}
        </span>
            </div>

            <div className="balance-section">
                <span>Your Balance: ${Number(balance).toFixed(2)}</span>
            </div>

            <div className="button-section">
                <button onClick={handleSend}>Send</button>
                <button onClick={handleTopup}>Topup</button>
            </div>

            <div className="logout-button">
                <button onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
}
