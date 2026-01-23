import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import CalendarPage from './pages/CalendarPage';
import ShoppingListPage from './pages/ShoppingListPage';
import MealsPage from './pages/MealsPage';
import IngredientsPage from './pages/IngredientsPage';
import SidesPage from './pages/SidesPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/calendar" replace />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="shopping" element={<ShoppingListPage />} />
            <Route path="meals" element={<MealsPage />} />
            <Route path="ingredients" element={<IngredientsPage />} />
            <Route path="sides" element={<SidesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
