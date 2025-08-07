import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { devLog, devError } from '../utils/logger';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated, loading, initialized } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [messageQueue, setMessageQueue] = useState([]);
  const [isReady, setIsReady] = useState(false);
  
  // Get storage key dynamically to ensure consistency
  const getStorageKey = useCallback(() => {
    if (!user?.user_id) {
      return null; // Return null for unauthenticated users instead of 'anonymous'
    }
    return `notifications_${user.user_id}`; // Use consistent format without v2
  }, [user?.user_id]);

  // Load notifications from localStorage when auth state is ready
  useEffect(() => {
    // Don't load until auth context has finished loading and is initialized
    if (loading || !initialized) {
      devLog('NotificationContext: Waiting for auth context to finish loading...', { loading, initialized });
      return;
    }

    devLog('NotificationContext: Auth state ready - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', !!user);
    
    // Clear notifications if not authenticated
    if (!isAuthenticated || !user?.user_id) {
      devLog('NotificationContext: User not authenticated, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
      setIsReady(false);
      return;
    }

    // Load notifications for authenticated user
    try {
      const userStorageKey = getStorageKey();
      const stored = userStorageKey ? localStorage.getItem(userStorageKey) : null;
      
      devLog('NotificationContext: Loading notifications for user:', user.user_id);
      devLog('NotificationContext: Storage key:', userStorageKey);
      devLog('NotificationContext: Stored data:', stored);
      
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        setNotifications(parsedNotifications);
        updateUnreadCount(parsedNotifications);
        devLog('NotificationContext: Loaded notifications count:', parsedNotifications.length);
      } else {
        devLog('NotificationContext: No stored notifications found');
        setNotifications([]);
        setUnreadCount(0);
      }
      
      // Mark context as ready after loading
      setIsReady(true);
      devLog('NotificationContext: Ready for WebSocket messages');
      
    } catch (error) {
      devError('Error loading notifications from storage:', error);
      setNotifications([]);
      setUnreadCount(0);
      setIsReady(true); // Still mark as ready even if loading failed
    }
  }, [loading, initialized, isAuthenticated, user?.user_id, getStorageKey]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (loading || !initialized) return; // Don't save during auth loading or before initialized
    
    const storageKey = getStorageKey();
    if (!storageKey) {
      // User not authenticated, don't save anything
      return;
    }

    try {
      if (notifications.length > 0) {
        const notificationData = JSON.stringify(notifications);
        
        // Check storage size (rough estimate)
        const sizeKB = new Blob([notificationData]).size / 1024;
        if (sizeKB > 500) { // Limit to 500KB per user
          devLog('NotificationContext: Storage size limit reached, trimming notifications');
          const trimmedNotifications = notifications.slice(0, 25); // Keep only 25 latest
          localStorage.setItem(storageKey, JSON.stringify(trimmedNotifications));
          setNotifications(trimmedNotifications);
          updateUnreadCount(trimmedNotifications);
        } else {
          localStorage.setItem(storageKey, notificationData);
        }
        devLog('NotificationContext: Saved to storage:', notifications.length, 'notifications to key:', storageKey, `(${sizeKB.toFixed(1)}KB)`);
      } else {
        // Clean up empty notification arrays
        localStorage.removeItem(storageKey);
        devLog('NotificationContext: Removed from storage (no notifications) key:', storageKey);
      }
    } catch (error) {
      devError('Error saving notifications to storage:', error);
      // If localStorage is full, try to free up space by clearing old notifications
      if (error.name === 'QuotaExceededError') {
        devLog('NotificationContext: Storage quota exceeded, clearing notifications');
        localStorage.removeItem(storageKey);
        setNotifications(notifications.slice(0, 10)); // Keep only 10 most recent
      }
    }
  }, [notifications, loading, getStorageKey]);

  const updateUnreadCount = (notificationList) => {
    const unread = notificationList.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  // Process queued messages when ready
  useEffect(() => {
    if (!isReady || messageQueue.length === 0) return;
    
    devLog('NotificationContext: Processing queued messages:', messageQueue.length);
    
    // Process all queued messages
    const processQueue = async () => {
      for (const queuedMessage of messageQueue) {
        try {
          await addNotificationWithRetry(queuedMessage, 3);
        } catch (error) {
          devError('Failed to process queued notification after retries:', error);
        }
      }
      setMessageQueue([]); // Clear queue after processing
    };
    
    processQueue();
  }, [isReady, messageQueue]);

  // Enhanced addNotification with retry logic and queuing
  const addNotificationWithRetry = useCallback(async (notification, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const newNotification = {
          ...notification,
          id: Date.now() + Math.random(),
          read: false,
          timestamp: Date.now(), // Always use current time for notifications
          sequence: notification.sequence, // Preserve WebSocket sequence
          ack_required: notification.ack_required
        };

        // Use Promise to handle setState asynchronously
        await new Promise((resolve, reject) => {
          setNotifications(prev => {
            try {
              const updated = [newNotification, ...prev];
              // Keep only last 50 notifications to prevent storage bloat
              const trimmed = updated.slice(0, 50);
              updateUnreadCount(trimmed);
              
              devLog('NotificationContext: Successfully added notification:', newNotification.id);
              resolve(trimmed);
              return trimmed;
            } catch (error) {
              reject(error);
              return prev;
            }
          });
        });
        
        // Success - send ACK if required
        if (notification.ack_required && notification.sequence) {
          // ACK handling would be implemented here
          devLog('NotificationContext: ACK required for sequence:', notification.sequence);
        }
        
        return; // Success, exit retry loop
        
      } catch (error) {
        devError(`Attempt ${attempt} failed to add notification:`, error);
        
        if (attempt === maxRetries) {
          throw error; // Final attempt failed
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }, []);

  // Public addNotification method with queuing
  const addNotification = useCallback((notification) => {
    if (!isReady) {
      // Queue message if context not ready
      devLog('NotificationContext: Queueing message (not ready):', notification.type);
      setMessageQueue(prev => [...prev, notification]);
      return;
    }
    
    // Process immediately if ready
    addNotificationWithRetry(notification, 3).catch(error => {
      devError('Failed to add notification after retries:', error);
    });
  }, [isReady, addNotificationWithRetry]);

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
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.removeItem(storageKey);
      devLog('NotificationContext: Cleared all notifications from storage key:', storageKey);
    }
  }, [getStorageKey]);

  const openNotificationPanel = useCallback(() => {
    devLog('NotificationContext: Opening notification panel');
    setIsNotificationPanelOpen(true);
  }, []);

  const closeNotificationPanel = useCallback(() => {
    devLog('NotificationContext: Closing notification panel');
    setIsNotificationPanelOpen(false);
  }, []);

  const toggleNotificationPanel = useCallback(() => {
    const newState = !isNotificationPanelOpen;
    devLog('NotificationContext: Toggling notification panel to:', newState);
    setIsNotificationPanelOpen(newState);
  }, [isNotificationPanelOpen]);

  const value = {
    notifications,
    unreadCount,
    isNotificationPanelOpen,
    isReady,
    messageQueue: messageQueue.length,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    openNotificationPanel,
    closeNotificationPanel,
    toggleNotificationPanel
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;