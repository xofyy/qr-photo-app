/**
 * Production-safe logging utility
 * Provides different log levels and categories
 */

// Check multiple environment indicators (Vercel sets VERCEL_ENV)
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     (!process.env.NODE_ENV && !process.env.VERCEL_ENV);

// Log levels: 0=none, 1=error, 2=warn, 3=info, 4=debug
const LOG_LEVEL = isDevelopment ? 4 : 1;

const shouldLog = (level) => {
  const levels = { error: 1, warn: 2, info: 3, debug: 4 };
  return LOG_LEVEL >= levels[level];
};

export const logger = {
  // Always log errors (even in production for debugging)
  error: (...args) => {
    if (shouldLog('error')) {
      console.error('🚨', ...args);
    }
  },
  
  // Warnings only in development  
  warn: (...args) => {
    if (shouldLog('warn')) {
      console.warn('⚠️', ...args);
    }
  },
  
  // Info logs only in development
  info: (...args) => {
    if (shouldLog('info')) {
      console.info('ℹ️', ...args);
    }
  },
  
  // Debug logs only in development (most verbose)
  debug: (...args) => {
    if (shouldLog('debug')) {
      console.debug('🔍', ...args);
    }
  },
  
  // Categorized loggers
  websocket: {
    connect: (...args) => shouldLog('debug') && console.debug('🔌 WS Connect:', ...args),
    message: (...args) => shouldLog('debug') && console.debug('💬 WS Message:', ...args),
    error: (...args) => shouldLog('error') && console.error('🚨 WS Error:', ...args),
    disconnect: (...args) => shouldLog('debug') && console.debug('🔌 WS Disconnect:', ...args)
  },
  
  auth: {
    login: (...args) => shouldLog('info') && console.info('🔐 Auth:', ...args),
    error: (...args) => shouldLog('error') && console.error('🚨 Auth Error:', ...args)
  },
  
  api: {
    request: (...args) => shouldLog('debug') && console.debug('📡 API Request:', ...args),
    response: (...args) => shouldLog('debug') && console.debug('📡 API Response:', ...args),
    error: (...args) => shouldLog('error') && console.error('🚨 API Error:', ...args)
  },
  
  i18n: {
    init: (...args) => shouldLog('info') && console.info('🌐 i18n Init:', ...args),
    change: (...args) => shouldLog('debug') && console.debug('🌐 i18n Language Change:', ...args),
    error: (...args) => shouldLog('error') && console.error('🚨 i18n Error:', ...args)
  }
};

// Backward compatibility
export const devLog = (...args) => logger.debug(...args);
export const devWarn = (...args) => logger.warn(...args);
export const devError = (...args) => logger.error(...args);

export default logger;