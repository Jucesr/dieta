import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const navItems = [
  { path: '/calendar', icon: '📅', label: 'Plan' },
  { path: '/shopping', icon: '🛒', label: 'Compras' },
  { path: '/meals', icon: '🍽️', label: 'Comidas' },
  { path: '/ingredients', icon: '🥕', label: 'Ingredientes' },
  { path: '/settings', icon: '⚙️', label: 'Config' }
];

const Navigation = () => {
  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <NavLink 
          key={item.path} 
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
