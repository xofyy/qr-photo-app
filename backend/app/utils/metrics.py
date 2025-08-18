"""
Prometheus metrics for QR PhotoShare application
"""
import time
from typing import Dict, Any
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import os

# Metrics definitions
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_SESSIONS = Gauge(
    'qr_active_sessions_total',
    'Number of active QR sessions'
)

PHOTOS_UPLOADED = Counter(
    'qr_photos_uploaded_total',
    'Total number of photos uploaded',
    ['session_id']
)

DATABASE_OPERATIONS = Counter(
    'database_operations_total',
    'Total database operations',
    ['operation', 'collection', 'status']
)

WEBSOCKET_CONNECTIONS = Gauge(
    'websocket_connections_active',
    'Number of active WebSocket connections'
)

RATE_LIMIT_HITS = Counter(
    'rate_limit_hits_total',
    'Total rate limit hits',
    ['endpoint', 'user_type']
)

class MetricsCollector:
    """Centralized metrics collection"""
    
    def __init__(self):
        self.start_time = time.time()
        
    def record_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Record HTTP request metrics"""
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status_code=str(status_code)
        ).inc()
        
        REQUEST_DURATION.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
    
    def record_photo_upload(self, session_id: str):
        """Record photo upload"""
        PHOTOS_UPLOADED.labels(session_id=session_id).inc()
    
    def update_active_sessions(self, count: int):
        """Update active sessions count"""
        ACTIVE_SESSIONS.set(count)
    
    def record_database_operation(self, operation: str, collection: str, success: bool):
        """Record database operation"""
        status = "success" if success else "error"
        DATABASE_OPERATIONS.labels(
            operation=operation,
            collection=collection,
            status=status
        ).inc()
    
    def update_websocket_connections(self, count: int):
        """Update WebSocket connections count"""
        WEBSOCKET_CONNECTIONS.set(count)
    
    def record_rate_limit_hit(self, endpoint: str, user_type: str):
        """Record rate limit hit"""
        RATE_LIMIT_HITS.labels(
            endpoint=endpoint,
            user_type=user_type
        ).inc()

# Global metrics collector instance
metrics_collector = MetricsCollector()

def start_metrics_server():
    """Start Prometheus metrics server"""
    metrics_port = int(os.getenv('METRICS_PORT', 9090))
    if os.getenv('ENABLE_METRICS', 'true').lower() == 'true':
        start_http_server(metrics_port)
        print(f"📊 Metrics server started on port {metrics_port}")

def get_app_info() -> Dict[str, Any]:
    """Get application information for metrics"""
    return {
        "version": "1.0.0",
        "environment": os.getenv("NODE_ENV", "development"),
        "uptime_seconds": time.time() - metrics_collector.start_time
    }