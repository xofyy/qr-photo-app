import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const NotificationPanel = ({ notifications, onMarkAsRead, onClearAll, isOpen, onClose }) => {
  const { t } = useTranslation(['notifications', 'common']);
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Click outside to close (desktop only, mobile uses backdrop)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        // Also check if the click was on the notification button itself
        const notificationButton = event.target.closest('[data-notification-button]');
        if (!notificationButton) {
          onClose();
        }
      }
    };
    
    if (isOpen && !isMobile) {
      // Use a slight delay to prevent immediate closure on the same click that opened it
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose, isMobile]);

  // Escape key handler
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatTime = (timestamp) => {
    let date;
    
    // Check if timestamp is a number (milliseconds) or string
    if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // Backend timestamp'i önce parse et
      const tempDate = new Date(timestamp);
      
      // Backend'den gelen timestamp muhtemelen server local time (UTC+0 server'da UTC+3 zaman)
      // Bu durumda 3 saat ekleyerek düzeltelim
      if (timestamp.includes('T') && !timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-')) {
        // 3 saat (10800000 ms) ekle çünkü backend server UTC'de çalışıyor ama local time gönderiyor
        date = new Date(tempDate.getTime() + (3 * 60 * 60 * 1000));
        
      } else {
        date = tempDate;
      }
    } else {
      return t('notifications:time.unknown', 'Unknown time');
    }
    
    // Check if timestamp is valid
    if (isNaN(date.getTime())) {
      return t('notifications:time.unknown', 'Unknown time');
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);


    if (diffMins < 1) return t('notifications:time.justNow');
    if (diffMins < 60) return t('notifications:time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notifications:time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notifications:time.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  const getNotificationTitle = (notification) => {
    switch (notification.type) {
      case 'photo_uploaded':
        return t('notifications:types.photo_uploaded');
      default:
        return t('notifications:types.notification');
    }
  };

  const getNotificationMessage = (notification) => {
    if (notification.type === 'photo_uploaded') {
      const data = notification.data;
      return t('notifications:messages.photo_uploaded', {
        uploaded_by: data?.uploaded_by || 'Someone',
        upload_count: data?.upload_count || 0
      });
    }
    return notification.message || t('notifications:messages.default');
  };

  // Content component to avoid duplication
  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">{t('notifications:title')}</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              {t('notifications:actions.clearAll')}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500 dark:text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto sm:max-h-80 max-sm:flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
            <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-gray-400 dark:text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t('notifications:empty.title')}</h3>
            <p className="text-xs text-gray-500 dark:text-dark-400">
              {t('notifications:empty.description')}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors cursor-pointer border-l-2 ${
                  !notification.read ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5' : 'border-transparent'
                }`}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.type === 'photo_uploaded' 
                    ? 'bg-green-100 dark:bg-green-500/20' 
                    : 'bg-blue-100 dark:bg-blue-500/20'
                }`}>
                  <svg className={`w-3 h-3 ${
                    notification.type === 'photo_uploaded' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {notification.type === 'photo_uploaded' ? (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </>
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
                      </>
                    )}
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {getNotificationTitle(notification)}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-dark-400">
                        {formatTime(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-dark-300 line-clamp-2">
                    {getNotificationMessage(notification)}
                  </p>
                  
                  {notification.session_id && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300">
                        {t('notifications:session', { id: notification.session_id.slice(0, 6) + '...' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 3 && (
        <div className="border-t border-gray-200 dark:border-dark-700 px-4 py-2">
          <p className="text-xs text-gray-500 dark:text-dark-400 text-center">
            {t('notifications:footer.showing', { count: notifications.length })}
          </p>
        </div>
      )}
    </>
  );

  // Single render with responsive classes - portal for mobile
  const panelMarkup = (
    <>
      {/* Mobile Backdrop - only visible on mobile */}
      <div 
        className="sm:hidden fixed inset-0 bg-black bg-opacity-50"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* Responsive Panel */}
      <div 
        ref={panelRef}
        className="
          sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-h-96 sm:bg-white sm:dark:bg-dark-800 sm:rounded-xl sm:shadow-lg sm:border sm:border-gray-200 sm:dark:border-dark-700 sm:z-50 sm:overflow-hidden
          max-sm:fixed max-sm:inset-x-4 max-sm:top-20 max-sm:bottom-4 max-sm:bg-white max-sm:dark:bg-dark-800 max-sm:rounded-xl max-sm:shadow-2xl max-sm:border max-sm:border-gray-200 max-sm:dark:border-dark-700 max-sm:overflow-hidden max-sm:flex max-sm:flex-col
        "
        style={{ zIndex: isMobile ? 9999 : 50 }}
      >
        {panelContent}
      </div>
    </>
  );

  // Portal to body for mobile, normal render for desktop
  if (isMobile) {
    return createPortal(panelMarkup, document.body);
  }
  
  return panelMarkup;
};

export default NotificationPanel;