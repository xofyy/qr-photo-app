import React, { createContext, useContext, useState, useEffect } from 'react';
import { devLog, devError } from '../utils/logger';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const storedToken = localStorage.getItem('auth_token');
    
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(storedToken);
        // Store user data for notification context recovery
        localStorage.setItem('user', JSON.stringify(userData));
        devLog('User authenticated:', userData);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      devError('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const login = (authToken) => {
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    // Re-check auth status to get user data
    checkAuthStatus();
  };

  const logout = async () => {
    try {
      // Call logout endpoint (optional)
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      devError('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setInitialized(false);
      devLog('User logged out');
    }
  };

  const initiateGoogleLogin = () => {
    // Redirect to backend OAuth2 endpoint
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const value = {
    user,
    token,
    login,
    logout,
    initiateGoogleLogin,
    loading,
    initialized,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};