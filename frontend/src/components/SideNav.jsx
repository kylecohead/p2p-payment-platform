import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/home', label: 'Dashboard' },
  { to: '/payments', label: 'Payments' }
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

