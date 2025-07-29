from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserUploadBase(BaseModel):
    session_id: str
    user_identifier: str  # Device fingerprint or IP-based ID
    user_ip: Optional[str] = None
    user_agent: Optional[str] = None

class UserUploadCreate(UserUploadBase):
    pass

class UserUpload(UserUploadBase):
    id: str
    upload_count: int = 0
    first_upload_at: datetime
    last_upload_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True

class UserUploadStats(BaseModel):
    user_identifier: str
    upload_count: int
    remaining_uploads: int
    max_allowed: int