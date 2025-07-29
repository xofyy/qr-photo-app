import hashlib
from typing import Optional
from fastapi import Request

def generate_user_identifier(request: Request, session_id: str) -> str:
    """
    Generate a unique identifier for anonymous users based on their request info.
    This creates a session-specific user ID that's consistent across uploads.
    """
    
    # Get identifying information from request
    user_agent = request.headers.get("user-agent", "unknown")
    client_host = request.client.host if request.client else "unknown"
    accept_language = request.headers.get("accept-language", "")
    accept_encoding = request.headers.get("accept-encoding", "")
    
    # Create a fingerprint string
    fingerprint_data = f"{user_agent}:{client_host}:{accept_language}:{accept_encoding}:{session_id}"
    
    # Generate a hash for privacy and consistency
    user_identifier = hashlib.sha256(fingerprint_data.encode()).hexdigest()[:32]
    
    return f"anon_{user_identifier}"

def get_user_ip(request: Request) -> str:
    """Get user's IP address from request"""
    # Check for forwarded headers first (in case of proxy/load balancer)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    
    # Fall back to direct client IP
    return request.client.host if request.client else "unknown"

def get_user_agent(request: Request) -> str:
    """Get user's user agent from request"""
    return request.headers.get("user-agent", "unknown")