from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SessionBase(BaseModel):
    max_photos: int = 10  # Legacy: kept for backward compatibility
    photos_per_user_limit: int = 10  # New: photos allowed per user

class SessionCreate(SessionBase):
    pass

class Session(SessionBase):
    id: str
    session_id: str
    photo_count: int
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True
