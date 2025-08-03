from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PhotoBase(BaseModel):
    filename: str
    session_id: str
    url: str
    user_identifier: Optional[str] = None

class PhotoCreate(PhotoBase):
    pass

class Photo(PhotoBase):
    id: str
    uploaded_at: datetime

    class Config:
        from_attributes = True
