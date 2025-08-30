import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

export default function Admin() {
  return (
    <div className="admin-page">
      <div className="page-header-with-actions">
        <h1 className="page-title">Admin Panel</h1>
        <div className="page-actions">
          {/* tbc */}
        </div>
      </div>

      <div className="admin-content">
        <p>Admin panel in dev</p>
      </div>
    </div>
  );
}