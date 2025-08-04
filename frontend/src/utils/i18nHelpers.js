import i18n from '../i18n';

// Format date to readable string with current locale
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const locale = i18n.language || 'en';
  
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format date only (no time) with current locale
export const formatDateOnly = (dateString) => {
  const date = new Date(dateString);
  const locale = i18n.language || 'en';
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format file size to human readable format with i18n
export const formatFileSize = (bytes, t) => {
  if (bytes === 0) return t('common:fileSize.zero');
  
  const k = 1024;
  const sizes = [
    t('common:fileSize.bytes'),
    t('common:fileSize.kb'),
    t('common:fileSize.mb'),
    t('common:fileSize.gb')
  ];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Handle API errors with i18n
export const handleApiError = (error, t) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.detail || error.response.data?.message || t('common:errors.unexpected');
    
    switch (status) {
      case 404:
        return t('common:errors.notFound');
      case 400:
        return message;
      case 401:
        return t('common:errors.unauthorized');
      case 403:
        return t('common:errors.forbidden');
      case 500:
        return t('common:errors.serverError');
      default:
        return message;
    }
  } else if (error.request) {
    // Request made but no response received
    return t('common:errors.networkError');
  } else {
    // Something else happened
    return error.message || t('common:errors.unexpected');
  }
};