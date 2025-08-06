import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Home from './pages/Home';
import SessionPage from './pages/SessionPage';
import SessionInfo from './pages/SessionInfo';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import AuthCallback from './pages/AuthCallback';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/session/:sessionId" element={<SessionPage />} />
                <Route path="/session-info/:sessionId" element={
                  <ProtectedRoute>
                    <SessionInfo />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/error" element={<AuthCallback />} />
              </Routes>
            </Layout>
            <PWAInstallPrompt />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
