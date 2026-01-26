import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../services/authService';
import './Navigation.css';

const navItems = [
  { path: '/calendar', icon: '📅', label: 'Plan' },
  { path: '/shopping', icon: '🛒', label: 'Compras' },
  { path: '/meals', icon: '🍽️', label: 'Comidas' },
  { path: '/ingredients', icon: '🥕', label: 'Ingredientes' },
  { path: '/settings', icon: '⚙️', label: 'Config' }
];

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  return (
    <>
      <div className="top-bar">
        <div className="user-info">
          <span className="user-name">{user?.displayName || user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Cerrar sesión
          </button>
        </div>
      </div>
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
    </>
  );
};

export default Navigation;
