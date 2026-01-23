import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import Toast from './ui/Toast';
import { useApp } from '../context/AppContext';

const Layout = () => {
  const { toasts } = useApp();

  return (
    <div className="app-layout">
      <main className="page">
        <Outlet />
      </main>
      <Navigation />
      <Toast toasts={toasts} />
    </div>
  );
};

export default Layout;
