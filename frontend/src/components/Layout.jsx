import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import SideNav from "./SideNav";

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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
