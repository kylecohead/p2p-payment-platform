import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import { examplePayments } from './examplePayments';


export default function Admin() {
  const navigate = useNavigate();
  
    // Replace with real data
    const payments = examplePayments;
  
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
      <div className="">
        <div className="page-header-with-actions">
          <h1 className="page-title">Admin Panel</h1>
          <div className="page-actions">
            <button className="btn btn-outline" onClick={handleExport}>
              Export
            </button>
          </div>
        </div>
  
        <div className="payments-cards card-grid">
          <div className="payment-card stat-card succeeded">
            <div className="card-header">Succeeded</div>
            <div className="card-value">R{totalAmount.toFixed(2)}</div>
            <div className="card-subtitle">{payments.length} records</div>
          </div>
          <div className="payment-card stat-card flagged">
            <div className="card-header">Flagged</div>
            <div className="card-value">R{totalCredits.toFixed(2)}</div>
            <div className="card-subtitle">{credits.length} records</div>
          </div>
          <div className="payment-card stat-card blocked">
            <div className="card-header">Blocked</div>
            <div className="card-value">R{Math.abs(totalDebits).toFixed(2)}</div>
            <div className="card-subtitle">{debits.length} records</div>
          </div>
        </div>
  
        <div className="admin-table-container">
          <table className="admin-table">
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
                <tr key={p.code}>
                  <td>{p.code}</td>
                  <td>{p.type}</td>
                  <td>{p.description}</td>
                  <td>{p.time}</td>
                  <td>{p.date}</td>
                  <td>{p.name}</td>
                  <td style={{color: p.amount < 0 ? 'red' : 'green', fontWeight: 'bold'}}>{p.amount < 0 ? '-' : ''}R{Math.abs(p.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  