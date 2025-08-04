/**
 * Production-safe logging utility
 * Only logs in development environment
 */

// Check multiple environment indicators (Vercel sets VERCEL_ENV)
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     (!process.env.NODE_ENV && !process.env.VERCEL_ENV);

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

export default logger;