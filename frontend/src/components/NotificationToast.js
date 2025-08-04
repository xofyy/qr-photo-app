import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const NotificationToast = ({ notification, onClose }) => {
  const { t } = useTranslation(['notifications', 'common']);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 5000); // Show for 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 transform transition-all duration-300";
    return isVisible 
      ? `${baseStyles} translate-x-0 opacity-100` 
      : `${baseStyles} translate-x-full opacity-0`;
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'photo_uploaded':
        return 'text-green-500';
      case 'connected':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'photo_uploaded':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'connected':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTitle = (type) => {
    switch (type) {
      case 'photo_uploaded':
        return t('notifications:types.photo_uploaded');
      case 'connected':
        return t('notifications:types.connected');
      default:
        return t('notifications:types.notification');
    }
  };

  const getMessage = () => {
    if (notification.type === 'photo_uploaded') {
      const data = notification.data;
      const byText = data?.uploaded_by ? t('notifications:messages.photo_uploaded_by', { name: data.uploaded_by }) : '';
      return t('notifications:messages.photo_uploaded', {
        uploaded_by: byText,
        upload_count: data?.upload_count || 0
      });
    }
    return notification.message || t('notifications:messages.default');
  };

  return (
    <div className={getToastStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${getIconColor(notification.type)}`}>
            {getIcon(notification.type)}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {getTitle(notification.type)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {getMessage()}
            </p>
            {notification.data?.url && (
              <div className="mt-2">
                <img 
                  src={notification.data.url}
                  alt="Uploaded"
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;