import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import Chatbot from "./Chatbot";

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    const raw = localStorage.getItem("currentUser");
    if (!raw) {
      navigate("/login");
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch (_) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
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
