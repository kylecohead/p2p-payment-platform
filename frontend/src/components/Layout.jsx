import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import { useSSE } from "../contexts/SSEContext";

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { connectSSE, disconnectSSE } = useSSE();

  useEffect(() => {
    const raw = localStorage.getItem("currentUser");
    if (!raw) {
      navigate("/login");
      return;
    }
    try {
      const userData = JSON.parse(raw);
      setUser(userData);
      
      // Establish global SSE connection for real-time updates across all pages
      if (userData.id) {
        console.log("Layout: Establishing global SSE connection");
        connectSSE(userData.id);
      }
    } catch (_) {
      navigate("/login");
    }

    // Cleanup SSE connection when component unmounts
    return () => {
      disconnectSSE();
    };
  }, [navigate]); // Remove connectSSE and disconnectSSE from dependencies

  return (
    <div className="container">
      <SideNav />
      <TopBar user={user} />
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
