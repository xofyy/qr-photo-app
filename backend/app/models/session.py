from typing import Optional
from datetime import datetime
from pydantic import BaseModel
import uuid

class SessionBase(BaseModel):
    max_photos: int = 10
    photo_count: int = 0
    is_active: bool = True
    created_at: datetime = None
    expires_at: Optional[datetime] = None

class SessionCreate(SessionBase):
    pass

class Session(SessionBase):
    id: str
    session_id: str

    class Config:
        from_attributes = True
