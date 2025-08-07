from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import time
import os
from typing import Dict, Tuple
import asyncio
from collections import defaultdict, deque
import hashlib

class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.blocked: Dict[str, float] = {}
    
    def _get_client_key(self, request: Request, user_id: str = None) -> str:
        """Generate a unique key for the client (user-based or IP-based)"""
        if user_id:
            # Authenticated users: use user_id for tracking
            return f"user:{user_id}"
        
        # Anonymous users: use IP + User-Agent
        # Try to get real IP through various headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        # Include user agent for better uniqueness
        user_agent = request.headers.get("user-agent", "")
        
        # Create hash of IP + partial user agent for privacy
        key_string = f"anon:{client_ip}:{user_agent[:50]}"
        return hashlib.sha256(key_string.encode()).hexdigest()[:16]
    
    def is_allowed(self, request: Request, max_requests: int = 100, window_seconds: int = 3600, user_id: str = None) -> Tuple[bool, dict]:
        """
        Check if request is allowed based on rate limits
        
        Args:
            request: FastAPI request object
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            user_id: Authenticated user ID (if available)
            
        Returns:
            Tuple of (is_allowed, info_dict)
        """
        client_key = self._get_client_key(request, user_id)
        current_time = time.time()
        
        # Check if client is temporarily blocked
        if client_key in self.blocked:
            if current_time < self.blocked[client_key]:
                remaining = int(self.blocked[client_key] - current_time)
                return False, {
                    "error": "Rate limit exceeded",
                    "retry_after": remaining,
                    "limit": max_requests,
                    "window": window_seconds
                }
            else:
                # Unblock client
                del self.blocked[client_key]
        
        # Clean old requests outside the window
        request_times = self.requests[client_key]
        while request_times and request_times[0] < current_time - window_seconds:
            request_times.popleft()
        
        # Check if limit exceeded
        if len(request_times) >= max_requests:
            # Block client for window duration
            self.blocked[client_key] = current_time + window_seconds
            return False, {
                "error": "Rate limit exceeded",
                "retry_after": window_seconds,
                "limit": max_requests,
                "window": window_seconds
            }
        
        # Add current request
        request_times.append(current_time)
        
        remaining = max_requests - len(request_times)
        return True, {
            "limit": max_requests,
            "remaining": remaining,
            "window": window_seconds,
            "reset_time": int(current_time + window_seconds)
        }

# Global rate limiter instance
rate_limiter = RateLimiter()

def create_rate_limit_middleware(max_requests: int = 100, window_seconds: int = 3600):
    """Create rate limiting middleware"""
    
    async def rate_limit_middleware(request: Request, call_next):
        # Skip rate limiting for certain paths
        skip_paths = ["/health", "/docs", "/openapi.json", "/favicon.ico"]
        if request.url.path in skip_paths:
            response = await call_next(request)
            return response
        
        # Check rate limit
        is_allowed, info = rate_limiter.is_allowed(request, max_requests, window_seconds)
        
        if not is_allowed:
            return JSONResponse(
                status_code=429,
                content=info,
                headers={
                    "Retry-After": str(info.get("retry_after", window_seconds)),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Window": str(window_seconds)
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit"] = str(info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(info["reset_time"])
        
        return response
    
    return rate_limit_middleware

# Specific rate limiters for different endpoints
class APIRateLimiter:
    """Enhanced rate limiter with different limits for different endpoints"""
    
    def __init__(self):
        self.limiter = RateLimiter()
        self.analytics = {
            'total_requests': 0,
            'blocked_requests': 0,
            'endpoint_stats': {},
            'user_stats': {},
            'hourly_stats': {}
        }
    
    def _is_development_environment(self) -> bool:
        """Check if running in development environment"""
        env = os.getenv('NODE_ENV', '').lower()
        return env in ['development', 'dev'] or os.getenv('DEBUG', '').lower() in ['true', '1']
    
    def _apply_environment_multiplier(self, base_limits: Tuple[int, int]) -> Tuple[int, int]:
        """Apply environment-specific multipliers to base limits"""
        max_requests, window_seconds = base_limits
        
        if self._is_development_environment():
            # Development: 3x higher limits for easier development
            return (max_requests * 3, window_seconds)
        
        return base_limits
    
    def get_limits_for_endpoint(self, path: str, method: str, user_id: str = None) -> Tuple[int, int]:
        """Get rate limits for specific endpoint with environment and user awareness"""
        is_authenticated = user_id is not None
        
        # Base limits for production with user-based adjustment
        base_limits = self._get_base_limits(path, method, is_authenticated)
        
        # Apply environment-specific adjustments
        return self._apply_environment_multiplier(base_limits)
    
    def _get_base_limits(self, path: str, method: str, is_authenticated: bool = False) -> Tuple[int, int]:
        """Get base rate limits for specific endpoint"""
        # Authenticated users get higher limits
        auth_multiplier = 2 if is_authenticated else 1
        
        # Upload endpoints - more restrictive
        if "/upload" in path:
            base_limit = 10 if not is_authenticated else 20
            return base_limit, 600  # Anonymous: 10/10min, Auth: 20/10min
        
        # Authentication endpoints - granular limits
        elif "/auth" in path:
            if "/auth/me" in path:
                base_limit = 100 if not is_authenticated else 200
                return base_limit, 3600  # Anonymous: 100/hour, Auth: 200/hour
            elif "/auth/google/callback" in path:
                return 20, 300   # OAuth callback: same for all
            elif "/auth/google" in path:
                return 15, 300   # OAuth initiation: same for all
            elif "/auth/logout" in path:
                return 10, 300   # Logout: same for all
            else:
                base_limit = 30 * auth_multiplier
                return base_limit, 300   # Other auth endpoints
        
        # Session creation
        elif path.startswith("/sessions") and method == "POST":
            base_limit = 20 * auth_multiplier
            return base_limit, 3600  # Anonymous: 20/hour, Auth: 40/hour
        
        # Admin endpoints - only for authenticated users
        elif "/admin" in path:
            if not is_authenticated:
                return 5, 300  # Very restrictive for anonymous
            return 50, 3600  # 50/hour for authenticated users
        
        # Default limits
        else:
            base_limit = 100 * auth_multiplier
            return base_limit, 3600  # Anonymous: 100/hour, Auth: 200/hour
    
    def record_request(self, endpoint: str, user_id: str = None, blocked: bool = False):
        """Record analytics data for rate limiting"""
        import time
        from datetime import datetime
        
        # Update total counters
        self.analytics['total_requests'] += 1
        if blocked:
            self.analytics['blocked_requests'] += 1
        
        # Update endpoint stats
        if endpoint not in self.analytics['endpoint_stats']:
            self.analytics['endpoint_stats'][endpoint] = {
                'total': 0, 'blocked': 0, 'last_request': None
            }
        
        endpoint_stats = self.analytics['endpoint_stats'][endpoint]
        endpoint_stats['total'] += 1
        if blocked:
            endpoint_stats['blocked'] += 1
        endpoint_stats['last_request'] = datetime.now().isoformat()
        
        # Update user stats (if authenticated)
        if user_id:
            if user_id not in self.analytics['user_stats']:
                self.analytics['user_stats'][user_id] = {
                    'total': 0, 'blocked': 0, 'endpoints': {}, 'last_request': None
                }
            
            user_stats = self.analytics['user_stats'][user_id]
            user_stats['total'] += 1
            if blocked:
                user_stats['blocked'] += 1
            user_stats['last_request'] = datetime.now().isoformat()
            
            # Track per-endpoint usage for this user
            if endpoint not in user_stats['endpoints']:
                user_stats['endpoints'][endpoint] = 0
            user_stats['endpoints'][endpoint] += 1
        
        # Update hourly stats
        current_hour = datetime.now().strftime('%Y-%m-%d-%H')
        if current_hour not in self.analytics['hourly_stats']:
            self.analytics['hourly_stats'][current_hour] = {
                'total': 0, 'blocked': 0, 'unique_users': set(), 'endpoints': {}
            }
        
        hourly_stats = self.analytics['hourly_stats'][current_hour]
        hourly_stats['total'] += 1
        if blocked:
            hourly_stats['blocked'] += 1
        if user_id:
            hourly_stats['unique_users'].add(user_id)
        
        if endpoint not in hourly_stats['endpoints']:
            hourly_stats['endpoints'][endpoint] = 0
        hourly_stats['endpoints'][endpoint] += 1
    
    def get_analytics_summary(self) -> dict:
        """Get rate limiting analytics summary"""
        from datetime import datetime, timedelta
        
        # Convert sets to counts for JSON serialization
        hourly_stats_serializable = {}
        for hour, stats in self.analytics['hourly_stats'].items():
            hourly_stats_serializable[hour] = {
                **stats,
                'unique_users': len(stats['unique_users'])
            }
        
        # Calculate rates
        total_requests = self.analytics['total_requests']
        blocked_requests = self.analytics['blocked_requests']
        block_rate = (blocked_requests / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'summary': {
                'total_requests': total_requests,
                'blocked_requests': blocked_requests,
                'block_rate_percentage': round(block_rate, 2),
                'active_endpoints': len(self.analytics['endpoint_stats']),
                'tracked_users': len(self.analytics['user_stats'])
            },
            'endpoint_stats': self.analytics['endpoint_stats'],
            'user_stats': self.analytics['user_stats'],
            'hourly_stats': hourly_stats_serializable,
            'current_active_limits': len(self.limiter.requests),
            'currently_blocked': len(self.limiter.blocked)
        }

api_rate_limiter = APIRateLimiter()