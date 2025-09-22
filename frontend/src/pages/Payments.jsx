import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Payments.css';
import ApiService from '../services/api';

export default function Payments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        if (!userData) {
          navigate('/login');
          return;
        }

        const response = await ApiService.getPaymentHistory(userData.id);
        setPayments(response.payment_history || []);
      } catch (err) {
        console.error('Failed to fetch payment history:', err);
        setError('Failed to load payment history');
        setPayments([]); // Fallback to empty array
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [navigate]);

  const handleNewPayment = () => {
    navigate('/send'); // Navigate to existing Send page
  };

  const handleExport = () => {
    // TODO: Backend export functionality 
    alert('Export functionality coming soon');
  };

  // Calculate totals
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const credits = payments.filter(p => p.type === 'Credit');
  const debits = payments.filter(p => p.type === 'Debit');
  const totalCredits = credits.reduce((sum, p) => sum + p.amount, 0);
  const totalDebits = debits.reduce((sum, p) => sum + p.amount, 0);

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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading payment history...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          {error}
        </div>
      ) : (
        <>
          <div className="payments-cards card-grid">
            <div className="payment-card stat-card">
              <div className="card-header">All payments</div>
              <div className="card-value">R{totalAmount.toFixed(2)}</div>
              <div className="card-subtitle">{payments.length} records</div>
            </div>
            <div className="payment-card stat-card credit">
              <div className="card-header">Credits</div>
              <div className="card-value">R{totalCredits.toFixed(2)}</div>
              <div className="card-subtitle">{credits.length} records</div>
            </div>
            <div className="payment-card stat-card debit">
              <div className="card-header">Debits</div>
              <div className="card-value">R{Math.abs(totalDebits).toFixed(2)}</div>
              <div className="card-subtitle">{debits.length} records</div>
            </div>
          </div>

          <div className="payments-table-container">
            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                No payment history yet. Make your first payment to see it here!
              </div>
            ) : (
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
                  {payments.map((p, idx) => (
                    <tr key={p.code || idx}>
                      <td>{p.code}</td>
                      <td>{p.type}</td>
                      <td>{p.description}</td>
                      <td>{p.time}</td>
                      <td>{p.date}</td>
                      <td>{p.name}</td>
                      <td style={{color: p.amount < 0 ? 'red' : 'green', fontWeight: 'bold'}}>
                        {p.amount < 0 ? '-' : ''}R{Math.abs(p.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
