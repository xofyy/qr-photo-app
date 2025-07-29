// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8001',
  TIMEOUT: 30000, // 30 seconds
};

// Session Configuration
export const SESSION_CONFIG = {
  MAX_PHOTOS: 10,
  EXPIRES_HOURS: 24,
};

// Camera Configuration
export const CAMERA_CONFIG = {
  VIDEO_CONSTRAINTS: {
    facingMode: 'environment',
    width: { ideal: 1280 },
    height: { ideal: 720 }
  },
  CAPTURE_FORMAT: 'image/jpeg',
  CAPTURE_QUALITY: 0.9,
  MIN_FILE_SIZE: 1000, // bytes
};

// UI Messages
export const MESSAGES = {
  ERRORS: {
    CAMERA_ACCESS: 'Camera access denied. Please allow camera permissions and ensure you are using HTTPS.',
    SESSION_NOT_FOUND: 'Session not found or has expired.',
    UPLOAD_FAILED: 'Failed to upload photo. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SESSION_FULL: 'This session has reached the maximum number of photos.',
  },
  SUCCESS: {
    PHOTO_UPLOADED: 'Photo uploaded successfully!',
    SESSION_CREATED: 'Session created successfully!',
  },
  INFO: {
    LOADING: 'Loading...',
    UPLOADING: 'Uploading photo...',
    PROCESSING: 'Processing...',
  }
};

// File validation
export const FILE_VALIDATION = {
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
};