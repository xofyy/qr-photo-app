import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({ size = 'md', text }) => {
  const { t } = useTranslation('common');
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const displayText = text || t('status.loading');
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400 ${sizeClasses[size]}`}></div>
      <p className="mt-4 text-gray-600 dark:text-dark-300">{displayText}</p>
    </div>
  );
};

export default LoadingSpinner;