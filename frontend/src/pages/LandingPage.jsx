// Landing page

import React from "react";
import { useNavigate } from "react-router-dom";
import PaymentNetwork from "../components/PaymentNetwork";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleOpenAccount = () => {
    navigate("/login?mode=signup");
  };

  return (
    <div className="landing-page-container">
      {/* Fullscreen payment network background */}
      <div className="fullscreen-network">
        <PaymentNetwork />
      </div>

      {/* Floating navigation bar */}
      <nav className="landing-nav">
        <div className="logo">SafePay+</div>
        <div className="nav-buttons">
          <button className="btn-signin" onClick={() => navigate("/login")}>
            Sign in
          </button>
          <button className="btn" onClick={handleOpenAccount}>
            Sign up
          </button>
        </div>
      </nav>

      <main className="landing-page-content">
        <div className="information-box">
          <div className="text-section">
            <h1>
              Optimise secure
              <br />
              peer-to-peer
              <br />
              payments
            </h1>
            <p>
              Payment processing platform that facilitates transactions
              <br />
              between people.
            </p>
            <button className="btn" onClick={handleOpenAccount}>
              Open Account
            </button>
          </div>
        </div>
      </main>
      <footer className="landing-page-footer">
        <p>&copy; 2025 Waluigi Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
