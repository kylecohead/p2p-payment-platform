import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SendPanel from "../components/SendPanel";
import SidePanel from "../components/SidePanel";
import Popup from "../components/Popup";
import SparkleOverlay from "../components/SparkleOverlay";
import ApiService from "../services/api";
import "./Beneficiaries.css";

export default function Beneficiaries() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [sendPopupOpen, setSendPopupOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      return currentUser.id;
    } catch (e) {
      return null;
    }
  };

  // Fetch beneficiaries on component mount
  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = getCurrentUserId();
        if (!userId) {
          throw new Error("User not logged in");
        }

        const response = await ApiService.getBeneficiaries(userId);
        setBeneficiaries(response.beneficiaries || []);
      } catch (err) {
        console.error("Failed to fetch beneficiaries:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBeneficiaries();
  }, []);

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
        <div className="page-actions">{/* Export button removed*/}</div>
      </div>

      {/* Beneficiaries Table */}
      <div className="beneficiaries-table-container">
        {loading ? (
          <div className="loading-state">
            <p>Loading beneficiaries...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Error loading beneficiaries: {error}</p>
            <button
              className="btn btn-outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="empty-state">
            <p>
              No beneficiaries found. Send a payment to someone to add them as a
              beneficiary.
            </p>
          </div>
        ) : (
          <table className="beneficiaries-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>PREVIOUS PAYMENT DATE</th>
                <th>PAYMENT COUNT</th>
              </tr>
            </thead>
            <tbody>
              {beneficiaries.map((b) => (
                <tr
                  key={b.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSelectedBeneficiary(b);
                    setPanelOpen(true);
                  }}
                >
                  <td>{b.name}</td>
                  <td>{b.email}</td>
                  <td>
                    {b.last_used_at
                      ? new Date(b.last_used_at).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td>{b.usage_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment panel */}
      {panelOpen && selectedBeneficiary && (
        <SidePanel
          title={`Send to ${selectedBeneficiary.name}`}
          onClose={() => setPanelOpen(false)}
        >
          <SendPanel
            recipientEmail={selectedBeneficiary.email}
            onCancel={() => setPanelOpen(false)}
            onSuccess={() => {
              setPanelOpen(false);
              setSendPopupOpen(true);
              // Refresh beneficiaries list to update usage count
              const userId = getCurrentUserId();
              if (userId) {
                ApiService.getBeneficiaries(userId)
                  .then((response) => {
                    setBeneficiaries(response.beneficiaries || []);
                  })
                  .catch(console.error);
              }
            }}
          />
        </SidePanel>
      )}
    </div>
  );
}
