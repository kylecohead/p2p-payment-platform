import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // reuse existing table styles
import './Payments.css';

export default function Payments() {
  const navigate = useNavigate();

  // Backend please replace these temp values with live API data
  const paymentSummary = {
    allPayments: 'temp',
    allPaymentsRecords: 'temp records',
    credits: 'temp', 
    creditsRecords: 'temp records',
    debits: 'temp',
    debitsRecords: 'temp records'
  };

  const handleNewPayment = () => {
    navigate('/send'); // Navigate to existing Send page
  };

  const handleExport = () => {
    // TODO: Backend export functionality 
    alert('Export functionality coming soon');
  };

  return (
    <div className="payments-page">
      <div className="page-header-with-actions">
        <h1 className="page-title">Payments</h1>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={handleExport}>
            Export
          </button>
          <button className="btn" onClick={handleNewPayment}>
            + New payment
          </button>
        </div>
      </div>

      <div className="payments-cards card-grid">
        <div className="payment-card stat-card">
          <div className="card-header">All payments</div>
          <div className="card-value">{paymentSummary.allPayments}</div>
          <div className="card-subtitle">{paymentSummary.allPaymentsRecords}</div>
        </div>
        
        <div className="payment-card stat-card credit">
          <div className="card-header">Credits</div>
          <div className="card-value">{paymentSummary.credits}</div>
          <div className="card-subtitle">{paymentSummary.creditsRecords}</div>
        </div>
        
        <div className="payment-card stat-card debit">
          <div className="card-header">Debits</div>
          <div className="card-value">{paymentSummary.debits}</div>
          <div className="card-subtitle">{paymentSummary.debitsRecords}</div>
        </div>
      </div>

      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>CODE</th>
              <th>TYPE</th>
              <th>DESCRIPTION</th>
              <th>TIME</th>
              <th>DATE</th>
              <th>NAME</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {/* Backend please populate this table with live payment data */}
            <tr>
              <td colSpan="7" className="empty-state">
                No payment history available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
