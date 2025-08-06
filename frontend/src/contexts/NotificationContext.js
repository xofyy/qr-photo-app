import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { devLog } from '../utils/logger';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Store notifications in localStorage for persistence
  const STORAGE_KEY = `notifications_${user?.user_id || 'anonymous'}`;

  // Load notifications from localStorage on mount
  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    
    devLog('NotificationContext: Direct check - token:', !!authToken, 'stored user:', !!storedUser);
    devLog('NotificationContext: AuthContext - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', !!user);
    
    // Use direct localStorage check to avoid auth timing issues
    if (authToken && storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        const userStorageKey = `notifications_${userObj.user_id}`;
        const stored = localStorage.getItem(userStorageKey);
        
        devLog('NotificationContext: Loading with direct auth check. User ID:', userObj.user_id);
        devLog('NotificationContext: Loaded from storage:', stored);
        
        if (stored) {
          const parsedNotifications = JSON.parse(stored);
          setNotifications(parsedNotifications);
          updateUnreadCount(parsedNotifications);
          devLog('NotificationContext: Set notifications count:', parsedNotifications.length);
        } else {
          devLog('NotificationContext: No stored notifications found');
        }
      } catch (error) {
        console.error('Error loading notifications from storage:', error);
      }
    } else {
      devLog('NotificationContext: No auth token or user, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (isAuthenticated && user?.user_id && !loading) {
      try {
        if (notifications.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
          devLog('NotificationContext: Saved to storage:', notifications.length, 'notifications');
        } else {
          localStorage.removeItem(STORAGE_KEY);
          devLog('NotificationContext: Removed from storage (no notifications)');
        }
      } catch (error) {
        console.error('Error saving notifications to storage:', error);
      }
    }
  }, [notifications, isAuthenticated, user?.user_id, loading, STORAGE_KEY]);

  const updateUnreadCount = (notificationList) => {
    const unread = notificationList.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  const addNotification = useCallback((notification) => {
    const newNotification = {
      ...notification,
      id: Date.now() + Math.random(),
      read: false,
      timestamp: notification.timestamp || new Date().toISOString()
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Keep only last 50 notifications to prevent storage bloat
      const trimmed = updated.slice(0, 50);
      updateUnreadCount(trimmed);
      return trimmed;
    });
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      updateUnreadCount(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      updateUnreadCount(updated);
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    if (user?.user_id) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user?.user_id, STORAGE_KEY]);

  const openNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(true);
  }, []);

  const closeNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(false);
  }, []);

  const value = {
    notifications,
    unreadCount,
    isNotificationPanelOpen,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    openNotificationPanel,
    closeNotificationPanel
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;