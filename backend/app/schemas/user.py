from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    avatar_url: Optional[str] = None
    provider: str
    provider_id: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    user_id: str
    avatar_url: Optional[str] = None
    provider: str
    provider_id: str
    created_at: datetime
    last_login: datetime
    is_active: bool = True


class UserResponse(UserBase):
    user_id: str
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
    expires_in: int
    user: UserResponse


class GoogleUserInfo(BaseModel):
    id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    verified_email: Optional[bool] = None