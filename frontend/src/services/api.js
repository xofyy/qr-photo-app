import axios from 'axios';

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

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/';
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

export default api;