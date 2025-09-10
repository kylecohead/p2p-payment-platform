import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ user }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <header className="topBar">
      <div className="logo" onClick={() => navigate('/dashboard')} style={{fontWeight:600}}>SafePay+</div>
      <div className="topbar-right">
        {user && <span className="user-name">{user.name}</span>}
        {user ? (
          <button className="btn" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <div>
            <button className="btn-signin" onClick={handleLogin}>
              Sign in
            </button>
            <button className="btn" onClick={handleLogin}>
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
