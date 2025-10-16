import React from "react";
import "./Popup.css";
import SafePayLogo from "../assets/SafePayLogo.png";


export default function Popup({ blackText, greenText, textRed = false, onClose, showPopup, setShowPopup }) {

  // Close the popup and navigate if needed
  const handleClose = () => {
    setShowPopup(false);
    if (onClose) {
      onClose();
    }
  };

  if (!showPopup) return null; // Only render if showPopup is true

  return (
    <div className="popup-container">
      {/* Background overlay */}
      <div className="popup-overlay" onClick={handleClose}></div>

      {/* Popup content */}
      <div className="popup-box">
        <div className="popup-content">
          <div
            className="logo-popup"
            style={{ fontWeight: 600 }}
          >
            SafePay+
          </div>
          <h2 className="popup-message">
            {blackText} <span className={textRed ? "red-text" : "green-text"}>{greenText}</span>
          </h2>
          <button className="btn" style={{ width: "100%" }} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
