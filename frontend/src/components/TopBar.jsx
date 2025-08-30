import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ user }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };
  return (
    <header className="topBar">
      <div className="logo" onClick={() => navigate('/dashboard')} style={{fontWeight:600}}>SafePay+</div>
      <div className="topbar-right">
        {user && <span className="user-name">{user.name}</span>}
        <button className="btn" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
