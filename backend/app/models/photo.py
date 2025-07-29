from datetime import datetime
from pydantic import BaseModel

class PhotoBase(BaseModel):
    filename: str
    session_id: str
    url: str
    uploaded_at: datetime = None

class PhotoCreate(PhotoBase):
    pass

class Photo(PhotoBase):
    id: str

    class Config:
        from_attributes = True
