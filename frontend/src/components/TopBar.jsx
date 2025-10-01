import React from "react";
import { useNavigate } from "react-router-dom";

export default function TopBar({ user, theme, onThemeToggle }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/login?mode=signup");
  };

  return (
    <header className="topBar">
      <div
        className="logo"
        onClick={() => navigate("/dashboard")}
        style={{ fontWeight: 600 }}
      >
        SafePay+
      </div>
      <div className="topbar-right">
        {user && <span className="user-name">{user.name}</span>}
        <div className="theme-toggle-container">
          <span className="theme-label">Light</span>
          <button
            className="theme-toggle-btn"
            onClick={onThemeToggle}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <div className={`theme-toggle-switch ${theme === "dark" ? "active" : ""}`}>
              <div className="theme-toggle-slider"></div>
            </div>
          </button>
          <span className="theme-label">Dark</span>
        </div>
        {user ? (
          <button className="btn" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <div>
            <button className="btn-signin" onClick={handleLogin}>
              Sign in
            </button>
            <button className="btn" onClick={handleSignup}>
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
