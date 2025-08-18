"""
Metrics collection middleware for FastAPI
"""
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.metrics import metrics_collector

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect HTTP request metrics"""
    
    async def dispatch(self, request: Request, call_next):
        """Process request and collect metrics"""
        start_time = time.time()
        
        # Get endpoint path for metrics (remove dynamic parts)
        path = request.url.path
        method = request.method
        
        # Normalize paths for better metrics grouping
        normalized_path = self._normalize_path(path)
        
        try:
            response = await call_next(request)
            
            # Calculate request duration
            duration = time.time() - start_time
            
            # Record metrics
            metrics_collector.record_request(
                method=method,
                endpoint=normalized_path,
                status_code=response.status_code,
                duration=duration
            )
            
            return response
            
        except Exception as e:
            # Record error metrics
            duration = time.time() - start_time
            metrics_collector.record_request(
                method=method,
                endpoint=normalized_path,
                status_code=500,
                duration=duration
            )
            raise e
    
    def _normalize_path(self, path: str) -> str:
        """Normalize API paths for metrics grouping"""
        # Replace dynamic segments with placeholders
        if path.startswith('/sessions/') and len(path.split('/')) >= 3:
            parts = path.split('/')
            if len(parts) >= 3 and parts[2] not in ['', 'health', 'admin']:
                # Replace session ID with placeholder
                parts[2] = '{session_id}'
                
                # Handle photo IDs
                if len(parts) >= 5 and parts[3] == 'photos' and parts[4]:
                    parts[4] = '{photo_id}'
                
                return '/'.join(parts)
        
        # Handle admin endpoints
        if path.startswith('/admin/sessions/') and len(path.split('/')) >= 4:
            parts = path.split('/')
            if len(parts) >= 4:
                parts[3] = '{session_id}'
                return '/'.join(parts)
        
        return path