from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class User(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None
    provider: str  # "google", "github"
    provider_id: str
    created_at: datetime
    last_login: datetime
    is_active: bool = True


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None
    provider: str
    provider_id: str


class UserResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None
    provider: str
    created_at: datetime
    last_login: datetime


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse