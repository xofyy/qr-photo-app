import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400 ${sizeClasses[size]}`}></div>
      {text && <p className="mt-4 text-gray-600 dark:text-dark-300">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;