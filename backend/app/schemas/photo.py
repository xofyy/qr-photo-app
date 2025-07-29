from pydantic import BaseModel
from datetime import datetime

class PhotoBase(BaseModel):
    filename: str
    session_id: str
    url: str

class PhotoCreate(PhotoBase):
    pass

class Photo(PhotoBase):
    id: str
    uploaded_at: datetime

    class Config:
        from_attributes = True
