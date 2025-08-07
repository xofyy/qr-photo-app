import axios from 'axios';
import { logger } from '../utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  maxContentLength: 10 * 1024 * 1024, // 10MB max file size
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Rate limit notification system
let rateLimitNotificationShown = false;
let rateLimitTimeouts = new Map();

const showRateLimitNotification = (retryAfter) => {
  if (rateLimitNotificationShown) return;
  
  rateLimitNotificationShown = true;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'rate-limit-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f59e0b;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 400px;
  `;
  
  const updateCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timeStr = minutes > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
    
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">⚠️ Çok fazla istek gönderildi</div>
      <div style="font-size: 14px; opacity: 0.9;">
        Lütfen ${timeStr} bekleyin ve tekrar deneyin.
      </div>
    `;
  };
  
  // Initial display
  updateCountdown(retryAfter);
  document.body.appendChild(notification);
  
  // Countdown timer
  let countdown = retryAfter;
  const countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      notification.remove();
      rateLimitNotificationShown = false;
    } else {
      updateCountdown(countdown);
    }
  }, 1000);
  
  // Auto-hide after retry period
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
    rateLimitNotificationShown = false;
  }, retryAfter * 1000);
};

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const endpoint = error.config?.url || 'unknown';
    
    // Handle different error types
    if (status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('last_auth_check');
      window.location.href = '/';
    } else if (status === 429) {
      // Rate limit exceeded
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
      const rateLimitInfo = {
        limit: error.response.headers['x-ratelimit-limit'],
        remaining: error.response.headers['x-ratelimit-remaining'],
        reset: error.response.headers['x-ratelimit-reset'],
      };
      
      logger.api.warn(`Rate limit hit on ${endpoint}:`, rateLimitInfo);
      
      // Show user-friendly notification
      showRateLimitNotification(retryAfter);
      
      // Store rate limit info for potential retry
      const errorWithRetryInfo = new Error('Rate limit exceeded');
      errorWithRetryInfo.isRateLimit = true;
      errorWithRetryInfo.retryAfter = retryAfter;
      errorWithRetryInfo.rateLimitInfo = rateLimitInfo;
      errorWithRetryInfo.originalError = error;
      
      return Promise.reject(errorWithRetryInfo);
    } else if (status === 502) {
      // Bad Gateway - backend is down
      logger.api.error('Backend service unavailable (502)');
      // Don't redirect, let the component handle it
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      // Network error or no response
      logger.api.error('Network error or backend unreachable');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to convert MongoDB response
const convertMongoResponse = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      id: item.id || item._id
    }));
  } else if (data && typeof data === 'object') {
    return {
      ...data,
      id: data.id || data._id
    };
  }
  return data;
};

export const createSession = async () => {
  const response = await api.post('/sessions/');
  response.data = convertMongoResponse(response.data);
  return response;
};

export const getSession = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);
  response.data = convertMongoResponse(response.data);
  return response;
};

export const getQRCode = (sessionId) => api.get(`/sessions/${sessionId}/qr`);

export const uploadPhoto = (sessionId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/sessions/${sessionId}/photos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getSessionPhotos = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/photos`);
  response.data = convertMongoResponse(response.data);
  return response;
};

export const getAllSessionPhotos = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/photos/all`);
  response.data = convertMongoResponse(response.data);
  return response;
};

export const deletePhoto = async (sessionId, photoId) => {
  const response = await api.delete(`/sessions/${sessionId}/photos/${photoId}`);
  return response;
};

// Admin endpoints
export const getAllSessions = async () => {
  const response = await api.get('/admin/sessions/');
  response.data = convertMongoResponse(response.data);
  return response;
};

export const deleteSession = (sessionId) => api.delete(`/admin/sessions/${sessionId}`);

// User session endpoints
export const getUserSessions = async () => {
  const response = await api.get('/user/sessions/');
  response.data = convertMongoResponse(response.data);
  return response;
};

// Per-user photo limit endpoints
export const getMyUploadStats = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/my-stats`);
  return response;
};

export const updateSessionPhotoLimit = async (sessionId, newLimit) => {
  const response = await api.patch(`/admin/sessions/${sessionId}/photo-limit?new_limit=${newLimit}`);
  return response;
};

export const getSessionUserStats = async (sessionId) => {
  const response = await api.get(`/admin/sessions/${sessionId}/user-stats`);
  response.data = convertMongoResponse(response.data);
  return response;
};

export const downloadSessionPhotos = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/download`, {
    responseType: 'blob'
  });
  return response;
};

// Health check endpoint
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return response;
  } catch (error) {
    throw error;
  }
};

export default api;