import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useStore';
import { authAPI } from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

// Layout
import Layout from './components/Layout';

function App() {
  const { setUser, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
      authAPI.getCurrentUser()
        .then((response) => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, [setUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } />

        <Route path="/" element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
        }>
          <Route index element={<DashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
