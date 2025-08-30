import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/payments', label: 'Payments' },
  { to: '/admin', label: 'Admin Panel' }
];

export default function SideNav() {
  return (
    <nav className="sidePanel">
      <ul>
        {navItems.map(i => (
          <li key={i.to}>
            <NavLink to={i.to} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>{i.label}</NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

