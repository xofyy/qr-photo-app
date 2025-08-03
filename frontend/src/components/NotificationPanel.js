import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const NotificationPanel = ({ notifications, onMarkAsRead, onClearAll, isOpen, onClose }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  if (!isOpen) return null;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'photo_uploaded':
        return (
          <div className="w-8 h-8 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12a4 4 0 018 0c0 7-3 9-3 9H7s-3-2-3-9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
        );
    }
  };

  const getNotificationTitle = (notification) => {
    switch (notification.type) {
      case 'photo_uploaded':
        return 'New Photo Uploaded';
      default:
        return 'Notification';
    }
  };

  const getNotificationMessage = (notification) => {
    if (notification.type === 'photo_uploaded') {
      const data = notification.data;
      return `${data?.uploaded_by || 'Someone'} uploaded a photo to your session. Total: ${data?.upload_count || 0} photos`;
    }
    return notification.message || 'You have a new notification';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{unreadCount} unread</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                You'll receive notifications here when someone uploads photos to your sessions.
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getNotificationTitle(notification)}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {getNotificationMessage(notification)}
                    </p>
                    
                    {notification.data?.url && (
                      <div className="mt-2">
                        <img 
                          src={notification.data.url}
                          alt="Uploaded"
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    {notification.session_id && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          Session: {notification.session_id.slice(0, 8)}...
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
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;