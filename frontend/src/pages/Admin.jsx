import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';


export default function Admin() {
  const navigate = useNavigate();
  
    // Replace with real data
    const payments = null;
  
    const handleExport = () => {
      // TODO: Backend export functionality 
      alert('Export functionality coming soon');
    };
  
    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const succeeded = payments.filter(p => p.status === 'Succeeded');
    const flagged = payments.filter(p => p.status === 'Flagged');
    const blocked = payments.filter(p => p.status === 'Blocked');
    const totalSucceeded = succeeded.reduce((sum, p) => sum + p.amount, 0);
    const totalFlagged = flagged.reduce((sum, p) => sum + p.amount, 0);
    const totalBlocked = blocked.reduce((sum, p) => sum + p.amount, 0);
  
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
            <div className="card-value">R{totalSucceeded.toFixed(2)}</div>
            <div className="card-subtitle">{succeeded.length} records</div>
          </div>
          <div className="payment-card stat-card flagged">
            <div className="card-header">Flagged</div>
            <div className="card-value">R{totalFlagged.toFixed(2)}</div>
            <div className="card-subtitle">{flagged.length} records</div>
          </div>
          <div className="payment-card stat-card blocked">
            <div className="card-header">Blocked</div>
            <div className="card-value">R{totalBlocked.toFixed(2)}</div>
            <div className="card-subtitle">{blocked.length} records</div>
          </div>
        </div>
  
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>CODE</th>
                <th>STATUS</th>
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
                  <td
                    style={{
                      color:
                        p.status === "Succeeded"
                          ? "var(--success)"
                          : p.status === "Flagged"
                          ? "var(--warning)"
                          : p.status === "Blocked"
                          ? "var(--error)"
                          : "inherit",
                    }}
                  >
                    {p.status}
                  </td>
                  <td>{p.description}</td>
                  <td>{p.time}</td>
                  <td>{p.date}</td>
                  <td>{p.name}</td>
                  <td style={{color: p.amount < 0 ? 'var(--success)' : 'var(--error)', fontWeight: 'bold'}}>{p.amount < 0 ? '-' : ''}R{Math.abs(p.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  