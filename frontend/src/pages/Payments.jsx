import React from 'react';
import './Dashboard.css'; // reuse existing table styles

export default function Payments() {
  return (
    <div className="payments-page">
      <div className="page-header">
        <h1 className="page-title">Payments</h1>
      </div>
      <div className="payments-table-container" style={{marginTop:'1.5rem'}}>
        <table className="payments-table">
          <thead>
            <tr>
              <th>PERSON</th>
              <th>ACCOUNT NUMBER</th>
              <th>EMAIL</th>
              <th>DATE</th>
              <th>TIME</th>
              <th>TOTAL</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
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
