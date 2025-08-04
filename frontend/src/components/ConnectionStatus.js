import React from 'react';
import { useTranslation } from 'react-i18next';

const ConnectionStatus = ({ 
  isConnected, 
  connectionType = 'disconnected', 
  isPollingActive = false,
  className = '' 
}) => {
  const { t } = useTranslation('common');
  
  const getStatusInfo = () => {
    if (connectionType === 'websocket') {
      return {
        icon: (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ),
        text: t('connectionStatus.realTime'),
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-500/20',
        title: t('connectionStatus.websocketTitle')
      };
    } else if (connectionType === 'polling') {
      return {
        icon: (
          <svg className="w-4 h-4 text-yellow-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        ),
        text: t('connectionStatus.polling'),
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-500/20',
        title: t('connectionStatus.pollingTitle')
      };
    } else {
      return {
        icon: (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        ),
        text: t('connectionStatus.offline'),
        color: 'text-gray-500 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-500/20',
        title: t('connectionStatus.offlineTitle')
      };
    }
  };

  const status = getStatusInfo();

  return (
    <div 
      className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color} ${className}`}
      title={status.title}
    >
      {status.icon}
      <span>{status.text}</span>
    </div>
  );
};

export default ConnectionStatus;