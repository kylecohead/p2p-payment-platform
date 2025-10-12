import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SendPanel from "../components/SendPanel";
import SidePanel from "../components/SidePanel";
import Popup from "../components/Popup";
import SparkleOverlay from "../components/SparkleOverlay";
import "./Beneficiaries.css";

// Hardcoded beneficiaries for now
const beneficiaries = [
  {
    email: "kyle@example.com",
    username: "kyle123",
    phone: "+27 82 123 4567",
  },
  {
    email: "sj@example.com",
    username: "sj",
    phone: "+27 83 987 6543",
  },
  {
    email: "diwan@example.com",
    username: "diwan",
    phone: "+27 84 555 1122",
  },
];

export default function Beneficiaries() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [sendPopupOpen, setSendPopupOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

  // Closes the popup and navigates to /dashboard
  function onSendPopupClose() {
    setSendPopupOpen(false);
    window.location.reload();
  }

  return (
    <div className="beneficiaries-page">
      {/* Send success popup */}
      <SparkleOverlay show={sendPopupOpen} />
      <Popup
        blackText="Payment "
        greenText="successful!"
        showPopup={sendPopupOpen}
        setShowPopup={setSendPopupOpen}
        onClose={onSendPopupClose}
      />

      <div className="page-header-with-actions">
        <h1 className="page-title">Beneficiaries</h1>
        <div className="page-actions">
          <button className="btn btn-outline">
            Export
          </button>
        </div>
      </div>

      {/* Beneficiaries Table */}
      <div className="beneficiaries-table-container">
        <table className="beneficiaries-table">
          <thead>
            <tr>
              <th>EMAIL</th>
              <th>USERNAME</th>
              <th>PHONE NUMBER</th>
            </tr>
          </thead>
          <tbody>
            {beneficiaries.map((b, idx) => (
              <tr
                key={idx}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedBeneficiary(b);
                  setPanelOpen(true);
                }}
              >
                <td>{b.email}</td>
                <td>{b.username}</td>
                <td>{b.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment panel */}
      {panelOpen && (
        <SidePanel title="New payment" onClose={() => setPanelOpen(false)}>
          <SendPanel
            recipientEmail={selectedBeneficiary?.email || ""}
            onCancel={() => setPanelOpen(false)}
            onSuccess={() => {
              setPanelOpen(false);
              setSendPopupOpen(true);
            }}
          />
        </SidePanel>
      )}
    </div>
  );
}
