import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

import httpx
from authlib.integrations.starlette_client import OAuth
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from starlette.config import Config
from starlette.requests import Request

from app.schemas.user import TokenData, UserResponse, GoogleUserInfo
from app import crud

# Configuration
config = Config('.env')
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# OAuth2 configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# OAuth setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Security
security = HTTPBearer(auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[TokenData]:
    """Verify JWT token and return user data"""
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            return None
            
        token_data = TokenData(user_id=user_id, email=email)
        return token_data
    except JWTError:
        return None


async def get_current_user(token_data: Optional[TokenData] = Depends(verify_token)) -> Optional[UserResponse]:
    """Get current authenticated user"""
    if not token_data:
        return None
    
    user = await crud.get_user_by_id(token_data.user_id)
    if user is None:
        return None
    
    return UserResponse(**user)


async def require_authentication(current_user: Optional[UserResponse] = Depends(get_current_user)) -> UserResponse:
    """Require user to be authenticated"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


async def get_google_user_info(access_token: str) -> GoogleUserInfo:
    """Get user info from Google using access token"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch user info from Google"
            )
        
        user_data = response.json()
        return GoogleUserInfo(**user_data)


def generate_user_id() -> str:
    """Generate a unique user ID"""
    return str(uuid.uuid4())


async def exchange_code_for_token(code: str) -> dict:
    """Exchange authorization code for access token"""
    token_url = "https://oauth2.googleapis.com/token"
    redirect_uri = f"{os.getenv('BACKEND_URL', 'http://localhost:8001')}/auth/google/callback"
    
    data = {
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': redirect_uri,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            token_url,
            data=data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        response.raise_for_status()
        return response.json()


async def get_google_user_info(access_token: str) -> GoogleUserInfo:
    """Get user info from Google using access token"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        response.raise_for_status()
        user_data = response.json()
        
        return GoogleUserInfo(
            id=user_data["id"],
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data.get("picture")
        )


