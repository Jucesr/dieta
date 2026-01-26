import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import CalendarPage from './pages/CalendarPage';
import ShoppingListPage from './pages/ShoppingListPage';
import MealsPage from './pages/MealsPage';
import IngredientsPage from './pages/IngredientsPage';
import SidesPage from './pages/SidesPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
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
    </AuthProvider>
  );
}

export default App;
