import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/payments", label: "Payments" },
  { to: "/admin", label: "Admin Panel" },
];

export default function SideNav({ theme, onThemeToggle }) {
  return (
    <nav className="sidePanel">
      <ul>
        {navItems.map((i) => (
          <li key={i.to}>
            <NavLink
              to={i.to}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {i.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Theme toggle at bottom of sidebar */}
      <div className="sidebar-theme-toggle">
        <div className="theme-toggle-label">Appearance</div>
        <div className="theme-toggle-container">
          <span className="theme-label">Light</span>
          <button
            className="theme-toggle-btn"
            onClick={onThemeToggle}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <div
              className={`theme-toggle-switch ${
                theme === "dark" ? "active" : ""
              }`}
            >
              <div className="theme-toggle-slider"></div>
            </div>
          </button>
          <span className="theme-label">Dark</span>
        </div>
      </div>
    </nav>
  );
}
