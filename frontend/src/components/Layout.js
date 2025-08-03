import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import DarkModeToggle from './DarkModeToggle';
import NotificationPanel from './NotificationPanel';

const Layout = ({ children }) => {
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
    clearAllNotifications
  } = useNotifications();

  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname === '/admin';
  const isDashboardPage = location.pathname === '/dashboard';
  const isSessionPage = location.pathname.startsWith('/session/');

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-dark-gradient">
      {/* Header */}
      <header className="bg-white/80 dark:bg-dark-800/90 backdrop-blur-md border-b border-gray-200/50 dark:border-dark-700/30 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center min-h-16 sm:min-h-20 lg:min-h-16 py-3 sm:py-4 lg:py-3">
            {/* Logo */}
            <div 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  QR PhotoShare
                </h1>
                <p className="text-xs text-gray-500 dark:text-dark-300 -mt-0.5 sm:-mt-1 hidden sm:block">Instant Photo Sessions</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-2 sm:space-x-4">
              {!isHomePage && (
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="hidden sm:block">Home</span>
                </button>
              )}

              {/* Notification Bell - Only for authenticated users */}
              {isAuthenticated && (
                <button
                  onClick={() => isNotificationPanelOpen ? closeNotificationPanel() : openNotificationPanel()}
                  className="relative flex items-center justify-center w-10 h-10 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
                  title="Notifications"
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
              )}

              {/* Dark Mode Toggle */}
              <DarkModeToggle />

              {/* Show Dashboard link if authenticated */}
              {isAuthenticated && !isDashboardPage && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="hidden sm:block">Dashboard</span>
                </button>
              )}
              
              {/* Show Admin link if authenticated */}
              {isAuthenticated && !isAdminPage && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="hidden sm:block">Admin</span>
                </button>
              )}

              {/* User info and logout */}
              {isAuthenticated && user && (
                <div className="flex items-center space-x-2 sm:space-x-3 ml-1 sm:ml-2">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    {user.avatar_url && (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name}
                        className="w-8 h-8 sm:w-9 sm:h-9 lg:w-8 lg:h-8 rounded-full border-2 border-gray-200 dark:border-dark-600 flex-shrink-0"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-dark-200 hidden sm:block truncate max-w-24 lg:max-w-32">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
                    title="Logout"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:block text-sm">Logout</span>
                  </button>
                </div>
              )}

              {isSessionPage && (
                <div className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 rounded-full text-xs sm:text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline">Active Session</span>
                  <span className="sm:hidden">Live</span>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      <NotificationPanel
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onClearAll={clearAllNotifications}
        isOpen={isNotificationPanelOpen}
        onClose={closeNotificationPanel}
      />

      {/* Main Content */}
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-dark-800/60 backdrop-blur-md border-t border-gray-200/50 dark:border-dark-700/30 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-dark-300">
              <span>© 2024 QR PhotoShare</span>
              <span className="hidden sm:block">•</span>
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure & Private</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-dark-400">
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Powered by CloudTech</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;