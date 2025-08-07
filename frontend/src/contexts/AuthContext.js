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
  const [lastAuthCheck, setLastAuthCheck] = useState(null);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
  
  // Cache settings
  const AUTH_CHECK_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Check if user is authenticated on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    // Try to load cached user data first
    const cachedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('auth_token');
    
    if (cachedUser && storedToken) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        setToken(storedToken);
        devLog('📱 Loaded cached user data:', userData);
        
        // Check if cache is still valid
        const lastCheck = localStorage.getItem('last_auth_check');
        const now = Date.now();
        
        if (lastCheck && (now - parseInt(lastCheck)) < AUTH_CHECK_CACHE_DURATION) {
          setLoading(false);
          setInitialized(true);
          devLog('✅ Using cached auth data (within 5min cache period)');
          return;
        }
      } catch (error) {
        devError('Failed to parse cached user data:', error);
      }
    }
    
    // Cache is invalid or doesn't exist, check with server
    await checkAuthStatus(false);
  };

  const checkAuthStatus = async (forceCheck = true) => {
    const storedToken = localStorage.getItem('auth_token');
    
    if (!storedToken) {
      clearAuthData();
      setLoading(false);
      setInitialized(true);
      return;
    }

    // Check cache validity for non-forced checks
    if (!forceCheck) {
      const lastCheck = localStorage.getItem('last_auth_check');
      const now = Date.now();
      
      if (lastCheck && (now - parseInt(lastCheck)) < AUTH_CHECK_CACHE_DURATION) {
        devLog('⏭️ Skipping auth check (cache still valid)');
        setLoading(false);
        setInitialized(true);
        return;
      }
    }

    try {
      devLog('🔄 Checking auth status with server...');
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
        // Store user data and timestamp for caching
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('last_auth_check', Date.now().toString());
        setLastAuthCheck(Date.now());
        devLog('✅ User authenticated:', userData);
      } else if (response.status === 429) {
        // Rate limit hit - use cached data if available
        devError('⚠️ Rate limit hit, using cached data');
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
            setToken(storedToken);
            devLog('📱 Using cached user data due to rate limit');
          } catch (error) {
            devError('Failed to parse cached user data:', error);
            clearAuthData();
          }
        } else {
          clearAuthData();
        }
      } else {
        // Token is invalid, remove it
        clearAuthData();
      }
    } catch (error) {
      devError('Auth check failed:', error);
      
      // On network error, try to use cached data
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          setToken(storedToken);
          devLog('📱 Using cached user data due to network error');
        } catch (parseError) {
          devError('Failed to parse cached user data:', parseError);
          clearAuthData();
        }
      } else {
        clearAuthData();
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_auth_check');
    setToken(null);
    setUser(null);
    setLastAuthCheck(null);
  };

  const login = (authToken) => {
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    // Force a fresh auth check to get user data
    checkAuthStatus(true);
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
      clearAuthData();
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