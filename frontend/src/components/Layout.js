import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getUserSessions } from '../services/api';
import { useLayoutWebSocketManager } from '../hooks/useLayoutWebSocket';
import UnifiedMenu from './UnifiedMenu';
import NotificationPanel from './NotificationPanel';
import { useTranslation } from 'react-i18next';

const Layout = ({ children }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    isNotificationPanelOpen, 
    openNotificationPanel, 
    closeNotificationPanel,
    markAsRead,
    clearAllNotifications,
    addNotification
  } = useNotifications();
  
  // Layout-level WebSocket management (MASTER CONTROLLER)
  const { 
    connectToSessions, 
    disconnectAll, 
    addMessageHandler,
    connectionSummary 
  } = useLayoutWebSocketManager();

  // Stable message handler reference
  const addNotificationRef = useRef(addNotification);
  const stableMessageHandlerRef = useRef(null);

  // Update ref when addNotification changes
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  // Removed mobile menu and user dropdown states - now handled by UnifiedMenu

  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname === '/admin';
  const isDashboardPage = location.pathname === '/dashboard';
  const isSessionPage = location.pathname.startsWith('/session/');

  // Layout WebSocket Management (SINGLE SOURCE OF TRUTH)
  useEffect(() => {
    const manageLayoutWebSocket = async () => {
      if (!isAuthenticated || !user) {
        // User not authenticated, disconnect all
        await disconnectAll();
        return;
      }

      try {
        // Get user sessions for WebSocket connections
        const response = await getUserSessions();
        const sessions = response.data;
        
        if (sessions.length > 0) {
          // Connect to all user sessions with priority
          await connectToSessions(sessions);
        }
      } catch (error) {
        console.error('Layout WebSocket error loading sessions:', error);
      }
    };

    manageLayoutWebSocket();
  }, [isAuthenticated, user, connectToSessions, disconnectAll]);

  // Register the stable message handler ONCE using refs
  useEffect(() => {
    if (!addMessageHandler) {
      return;
    }

    // Create a truly stable handler that uses refs
    const trulyStableHandler = (message) => {
      if (message.type === 'photo_uploaded') {
        // Use ref to get current addNotification
        const currentAddNotification = addNotificationRef.current;
        if (currentAddNotification) {
          try {
            currentAddNotification(message);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        }
      }
    };

    stableMessageHandlerRef.current = trulyStableHandler;
    const removeHandler = addMessageHandler(trulyStableHandler);
    
    return () => {
      if (removeHandler) {
        removeHandler();
      }
      stableMessageHandlerRef.current = null;
    };
  }, [addMessageHandler]); // Only depends on addMessageHandler, not addNotification


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectAll();
    };
  }, [disconnectAll]);

  // Click outside handling now managed by UnifiedMenu

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-dark-gradient">
      {/* Header */}
      <header className="bg-white/80 dark:bg-dark-800/90 backdrop-blur-md border-b border-gray-200/50 dark:border-dark-700/30 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div 
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  {t('appName')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-dark-300 -mt-1">{t('tagline')}</p>
              </div>
            </div>

            {/* Clean Header - No desktop navigation buttons */}

            {/* Right side actions */}
            <div className="flex items-center space-x-3">
              
              {/* Session Status Badge */}
              {isSessionPage && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                  <span>{t('status.liveSession')}</span>
                </div>
              )}

              {/* Notification Button */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => isNotificationPanelOpen ? closeNotificationPanel() : openNotificationPanel()}
                    className="relative p-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Panel */}
                  {isNotificationPanelOpen && (
                    <NotificationPanel
                      notifications={notifications}
                      onMarkAsRead={markAsRead}
                      onClearAll={clearAllNotifications}
                      isOpen={isNotificationPanelOpen}
                      onClose={closeNotificationPanel}
                    />
                  )}
                </div>
              )}

              {/* Unified Menu */}
              <UnifiedMenu />
            </div>
          </div>

        </div>
      </header>


      {/* Main Content */}
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-dark-800/60 backdrop-blur-md border-t border-gray-200/50 dark:border-dark-700/30 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-dark-300">
              <span>{t('footer.copyright')}</span>
              <span className="hidden sm:block">•</span>
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('footer.encrypted')}</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-dark-400">
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>{t('footer.builtWith')}</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;