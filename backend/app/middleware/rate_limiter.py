from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import time
from typing import Dict, Tuple
import asyncio
from collections import defaultdict, deque
import hashlib

class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.blocked: Dict[str, float] = {}
    
    def _get_client_key(self, request: Request) -> str:
        """Generate a unique key for the client"""
        # Try to get real IP through various headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        # Include user agent for better uniqueness
        user_agent = request.headers.get("user-agent", "")
        
        # Create hash of IP + partial user agent for privacy
        key_string = f"{client_ip}:{user_agent[:50]}"
        return hashlib.sha256(key_string.encode()).hexdigest()[:16]
    
    def is_allowed(self, request: Request, max_requests: int = 100, window_seconds: int = 3600) -> Tuple[bool, dict]:
        """
        Check if request is allowed based on rate limits
        
        Args:
            request: FastAPI request object
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            
        Returns:
            Tuple of (is_allowed, info_dict)
        """
        client_key = self._get_client_key(request)
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
    
    def get_limits_for_endpoint(self, path: str, method: str) -> Tuple[int, int]:
        """Get rate limits for specific endpoint"""
        # Upload endpoints - more restrictive
        if "/upload" in path:
            return 10, 600  # 10 uploads per 10 minutes
        
        # Authentication endpoints
        elif "/auth" in path:
            return 50, 300   # 5 auth attempts per 5 minutes
        
        # Session creation
        elif path.startswith("/sessions") and method == "POST":
            return 20, 3600  # 20 sessions per hour
        
        # Default limits
        else:
            return 100, 3600  # 100 requests per hour

api_rate_limiter = APIRateLimiter()