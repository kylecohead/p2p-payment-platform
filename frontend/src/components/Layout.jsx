import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import TopBar from './TopBar';
import SideNav from './SideNav';

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);


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
