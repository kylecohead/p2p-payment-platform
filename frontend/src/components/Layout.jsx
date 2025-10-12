import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import { useSSE } from "../contexts/SSEContext";
import Chatbot from "./Chatbot";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const { connectSSE, disconnectSSE } = useSSE();
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage or default to light
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    const raw = localStorage.getItem("currentUser");
    if (!raw) {
      navigate("/login");
      return;
    }
    try {
      const parsedUser = JSON.parse(raw);
      setUser(parsedUser);

      // Restrict admin from /dashboard or /payments
      if (
        parsedUser?.admin === true &&
        (location.pathname === "/dashboard" || location.pathname === "/payments" || location.pathname === "/beneficiaries")
      ) {
        navigate("/restricted", { replace: true });
      }
      // Restrict non-admin from /admin
      if (parsedUser?.admin !== true && location.pathname === "/admin") {
        navigate("/restricted", { replace: true });
      }
    } catch (_) {
      navigate("/login");
    }
  }, [navigate, location]);

  // Connect to SSE when user is loaded
  useEffect(() => {
    if (user?.user_id) {
      connectSSE(user.user_id);
    }

    // Cleanup: disconnect SSE when component unmounts or user changes
    return () => {
      if (user?.user_id) {
        disconnectSSE();
      }
    };
  }, [user?.user_id, connectSSE, disconnectSSE]);

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="container">
      <SideNav theme={theme} onThemeToggle={toggleTheme} />
      <TopBar user={user} />
      <main className="content">
        <Outlet />
      </main>
      <Chatbot />
    </div>
  );
}
