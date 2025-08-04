import os
import logging
import sys
from typing import Any

def setup_logger():
    """Setup logging configuration based on environment"""
    # Check multiple environment indicators for production
    env = (os.getenv('NODE_ENV', '') or 
           os.getenv('RAILWAY_ENVIRONMENT', '') or 
           os.getenv('VERCEL_ENV', '') or 
           'development').lower()
    
    is_production = env in ('production', 'prod')
    
    # Configure logging level
    if is_production:
        log_level = logging.WARNING
    else:
        log_level = logging.INFO
    
    # Setup logging
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    return logging.getLogger('qr-photo-app')

def get_logger():
    """Get the application logger"""
    return logging.getLogger('qr-photo-app')

def safe_log(message: str, level: str = 'info', *args: Any):
    """Safe logging function that respects environment settings"""
    # Check multiple environment indicators for production
    env = (os.getenv('NODE_ENV', '') or 
           os.getenv('RAILWAY_ENVIRONMENT', '') or 
           os.getenv('VERCEL_ENV', '') or 
           'development').lower()
    
    is_production = env in ('production', 'prod')
    
    # In production, only log warnings and errors
    if is_production and level in ('info', 'debug'):
        return
    
    logger = get_logger()
    
    if level == 'error':
        logger.error(message, *args)
    elif level == 'warning':
        logger.warning(message, *args)
    elif level == 'info':
        logger.info(message, *args)
    elif level == 'debug':
        logger.debug(message, *args)

# Initialize logger
setup_logger()