// Landing page

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import "./LandingPage.css";
import P2P from "../assets/P2P.png";
import ShadowLeft from "../assets/ShadowLeft.png";
import ShadowRight from "../assets/ShadowRight.png";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleOpenAccount = () => {
    navigate("/login?mode=signup");
  };

  return (
    <div className="landing-page-container">
      <TopBar />
      <main className="landing-page-content">
        <img src={ShadowLeft} alt="" className="shadow-shape-left" />
        <img src={ShadowRight} alt="" className="shadow-shape-right" />
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
          <div className="image-section">
            <img src={P2P} alt="P2P Illustration" className="p2p-image" />
          </div>
        </div>
      </main>
      <footer className="landing-page-footer">
        <p>&copy; 2025 Waluigi Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
