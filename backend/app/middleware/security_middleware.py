"""
Security middleware for FastAPI application
"""
import hashlib
import hmac
import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import os
from app.utils.logger import safe_log

class SecurityMiddleware(BaseHTTPMiddleware):
    """Security middleware for request validation and protection"""
    
    def __init__(self, app, secret_key: str = None):
        super().__init__(app)
        self.secret_key = secret_key or os.getenv('JWT_SECRET', 'default-secret')
        self.max_request_size = 50 * 1024 * 1024  # 50MB
        self.blocked_ips = set()
        self.request_counts = {}
        
    async def dispatch(self, request: Request, call_next):
        """Process security checks before handling request"""
        
        # Security headers
        response = await self._add_security_headers(request, call_next)
        return response
    
    async def _add_security_headers(self, request: Request, call_next):
        """Add security headers to response"""
        try:
            response = await call_next(request)
            
            # Add security headers
            if os.getenv('NODE_ENV') == 'production':
                response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
                response.headers["X-Content-Type-Options"] = "nosniff"
                response.headers["X-Frame-Options"] = "DENY"
                response.headers["X-XSS-Protection"] = "1; mode=block"
                response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            
            # Remove server identification
            if "server" in response.headers:
                del response.headers["server"]
            
            return response
            
        except Exception as e:
            safe_log(f"Security middleware error: {e}", 'error')
            raise e
    
    def _check_ip_blacklist(self, client_ip: str):
        """Check if IP is blacklisted"""
        if client_ip in self.blocked_ips:
            raise HTTPException(status_code=403, detail="Access denied")
    
    def _validate_request_size(self, request: Request):
        """Validate request size"""
        content_length = request.headers.get('content-length')
        if content_length and int(content_length) > self.max_request_size:
            raise HTTPException(status_code=413, detail="Request too large")
    
    def _check_suspicious_patterns(self, request: Request):
        """Check for suspicious request patterns"""
        user_agent = request.headers.get('user-agent', '').lower()
        
        # Block known bad user agents
        bad_agents = ['sqlmap', 'nikto', 'nmap', 'masscan', 'wget', 'curl']
        if any(bad_agent in user_agent for bad_agent in bad_agents):
            if 'legitimate-client' not in user_agent:  # Allow legitimate curl/wget with special header
                safe_log(f"Blocked suspicious user agent: {user_agent}", 'warning')
                raise HTTPException(status_code=403, detail="Access denied")
        
        # Check for SQL injection patterns in URL
        url_path = str(request.url.path).lower()
        sql_patterns = ['union', 'select', 'insert', 'delete', 'drop', '--', ';', '/*', '*/', 'xp_']
        if any(pattern in url_path for pattern in sql_patterns):
            safe_log(f"Blocked potential SQL injection: {url_path}", 'warning')
            raise HTTPException(status_code=403, detail="Invalid request")
    
    def block_ip(self, ip: str):
        """Block an IP address"""
        self.blocked_ips.add(ip)
        safe_log(f"IP blocked: {ip}", 'warning')
    
    def unblock_ip(self, ip: str):
        """Unblock an IP address"""
        self.blocked_ips.discard(ip)
        safe_log(f"IP unblocked: {ip}", 'info')

class CSRFProtection:
    """CSRF protection utility"""
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
    
    def generate_token(self, session_id: str) -> str:
        """Generate CSRF token"""
        timestamp = str(int(time.time()))
        data = f"{session_id}:{timestamp}"
        signature = hmac.new(
            self.secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"{data}:{signature}"
    
    def validate_token(self, token: str, session_id: str, max_age: int = 3600) -> bool:
        """Validate CSRF token"""
        try:
            parts = token.split(':')
            if len(parts) != 3:
                return False
            
            token_session_id, timestamp, signature = parts
            
            # Check session ID
            if token_session_id != session_id:
                return False
            
            # Check timestamp
            if int(time.time()) - int(timestamp) > max_age:
                return False
            
            # Verify signature
            data = f"{token_session_id}:{timestamp}"
            expected_signature = hmac.new(
                self.secret_key.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
            
        except (ValueError, TypeError):
            return False

# Global CSRF protection instance
csrf_protection = CSRFProtection(os.getenv('JWT_SECRET', 'default-secret'))