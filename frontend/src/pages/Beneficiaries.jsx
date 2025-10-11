import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SendPanel from "../components/SendPanel";
import SidePanel from "../components/SidePanel";
import Popup from "../components/Popup";
import SparkleOverlay from "../components/SparkleOverlay";
import "./Beneficiaries.css";

export default function Beneficiaries() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [sendPopupOpen, setSendPopupOpen] = useState(false);

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

      {panelOpen && (
        <SidePanel title="New payment" onClose={() => setPanelOpen(false)}>
        <SendPanel
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
