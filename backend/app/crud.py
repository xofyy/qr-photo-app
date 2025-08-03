from datetime import datetime, timedelta
import uuid
from typing import Optional
from app import schemas
from app.schemas.user import UserCreate, UserUpdate, UserInDB
from app.database import get_sessions_collection, get_photos_collection, get_users_collection, get_user_uploads_collection
from bson import ObjectId

async def get_session(session_id: str):
    sessions_collection = get_sessions_collection()
    session = await sessions_collection.find_one({"session_id": session_id})
    return session

async def get_active_session(session_id: str):
    sessions_collection = get_sessions_collection()
    session = await sessions_collection.find_one({
        "session_id": session_id,
        "is_active": True,
        "photo_count": {"$lt": 10}
    })
    return session

async def create_session(session: schemas.SessionCreate):
    sessions_collection = get_sessions_collection()
    
    session_dict = session.dict()
    session_dict["session_id"] = str(uuid.uuid4())
    session_dict["photo_count"] = 0
    session_dict["is_active"] = True
    session_dict["created_at"] = datetime.utcnow()
    session_dict["expires_at"] = datetime.utcnow() + timedelta(hours=24)
    
    # Ensure photos_per_user_limit is set (default to 10 if not provided)
    if "photos_per_user_limit" not in session_dict or session_dict["photos_per_user_limit"] is None:
        session_dict["photos_per_user_limit"] = 10
    
    result = await sessions_collection.insert_one(session_dict)
    session_dict["id"] = str(result.inserted_id)
    
    return session_dict

async def increment_photo_count(session_id: str):
    sessions_collection = get_sessions_collection()
    # Use $inc operator to increment photo_count by 1
    await sessions_collection.update_one(
        {"session_id": session_id},
        {"$inc": {"photo_count": 1}}
    )
    return await get_session(session_id)

async def decrement_photo_count(session_id: str):
    sessions_collection = get_sessions_collection()
    # Use $inc operator to decrement photo_count by 1
    await sessions_collection.update_one(
        {"session_id": session_id},
        {"$inc": {"photo_count": -1}}
    )
    return await get_session(session_id)

async def create_photo(photo: schemas.PhotoCreate):
    photos_collection = get_photos_collection()
    
    photo_dict = photo.dict()
    photo_dict["uploaded_at"] = datetime.utcnow()
    
    result = await photos_collection.insert_one(photo_dict)
    photo_dict["id"] = str(result.inserted_id)
    
    return photo_dict

async def get_photos_by_session(session_id: str):
    photos_collection = get_photos_collection()
    cursor = photos_collection.find({"session_id": session_id})
    photos = await cursor.to_list(length=100)
    return photos

async def get_photos_by_session_and_user(session_id: str, user_identifier: str):
    """Get photos uploaded by a specific user in a session"""
    photos_collection = get_photos_collection()
    cursor = photos_collection.find({
        "session_id": session_id,
        "user_identifier": user_identifier
    })
    photos = await cursor.to_list(length=100)
    return photos

async def get_all_sessions():
    sessions_collection = get_sessions_collection()
    cursor = sessions_collection.find()
    sessions = await cursor.to_list(length=100)
    return sessions

async def delete_session(session_id: str):
    sessions_collection = get_sessions_collection()
    photos_collection = get_photos_collection()
    
    # Delete photos
    await photos_collection.delete_many({"session_id": session_id})
    
    # Delete session
    result = await sessions_collection.delete_one({"session_id": session_id})
    return result.deleted_count > 0


# User CRUD operations
async def create_user(user: UserCreate) -> dict:
    """Create a new user"""
    users_collection = get_users_collection()
    
    user_dict = user.dict()
    user_dict["user_id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.utcnow()
    user_dict["last_login"] = datetime.utcnow()
    user_dict["is_active"] = True
    
    result = await users_collection.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    return user_dict


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by user_id"""
    users_collection = get_users_collection()
    user = await users_collection.find_one({"user_id": user_id})
    return user


async def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email"""
    users_collection = get_users_collection()
    user = await users_collection.find_one({"email": email})
    return user


async def get_user_by_provider_id(provider: str, provider_id: str) -> Optional[dict]:
    """Get user by OAuth provider ID"""
    users_collection = get_users_collection()
    user = await users_collection.find_one({
        "provider": provider,
        "provider_id": provider_id
    })
    return user


async def update_user(user_id: str, user_update: UserUpdate) -> Optional[dict]:
    """Update user information"""
    users_collection = get_users_collection()
    
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if update_data:
        await users_collection.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    
    return await get_user_by_id(user_id)


async def update_user_last_login(user_id: str) -> None:
    """Update user's last login timestamp"""
    users_collection = get_users_collection()
    await users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"last_login": datetime.utcnow()}}
    )


# Update session creation to include owner
async def create_session_with_owner(session: schemas.SessionCreate, owner_id: str = None, owner_name: str = None):
    """Create session with optional owner information"""
    sessions_collection = get_sessions_collection()
    
    session_dict = session.dict()
    session_dict["session_id"] = str(uuid.uuid4())
    session_dict["photo_count"] = 0
    session_dict["is_active"] = True
    session_dict["created_at"] = datetime.utcnow()
    session_dict["expires_at"] = datetime.utcnow() + timedelta(hours=24)
    
    # Ensure photos_per_user_limit is set (default to 10 if not provided)
    if "photos_per_user_limit" not in session_dict or session_dict["photos_per_user_limit"] is None:
        session_dict["photos_per_user_limit"] = 10
    
    # Add owner information if provided
    if owner_id:
        session_dict["owner_id"] = owner_id
        session_dict["created_by_name"] = owner_name
        session_dict["is_public"] = True  # Allow anonymous photo uploads
    else:
        session_dict["owner_id"] = None
        session_dict["created_by_name"] = "Anonymous"
        session_dict["is_public"] = True
    
    result = await sessions_collection.insert_one(session_dict)
    session_dict["id"] = str(result.inserted_id)
    
    return session_dict


async def get_sessions_by_owner(owner_id: str):
    """Get all sessions created by a specific user"""
    sessions_collection = get_sessions_collection()
    cursor = sessions_collection.find({"owner_id": owner_id})
    sessions = await cursor.to_list(length=100)
    return sessions


# User Upload Tracking CRUD operations
async def get_user_upload_stats(session_id: str, user_identifier: str) -> Optional[dict]:
    """Get upload statistics for a specific user in a session"""
    user_uploads_collection = get_user_uploads_collection()
    user_upload = await user_uploads_collection.find_one({
        "session_id": session_id,
        "user_identifier": user_identifier
    })
    return user_upload


async def create_or_update_user_upload(session_id: str, user_identifier: str, user_ip: str = None, user_agent: str = None) -> dict:
    """Create new user upload record or increment existing one"""
    user_uploads_collection = get_user_uploads_collection()
    
    # Try to find existing record
    existing_upload = await user_uploads_collection.find_one({
        "session_id": session_id,
        "user_identifier": user_identifier
    })
    
    if existing_upload:
        # Increment upload count
        await user_uploads_collection.update_one(
            {"_id": existing_upload["_id"]},
            {
                "$inc": {"upload_count": 1},
                "$set": {"last_upload_at": datetime.utcnow()}
            }
        )
        # Return updated record
        return await user_uploads_collection.find_one({"_id": existing_upload["_id"]})
    else:
        # Create new record
        upload_record = {
            "session_id": session_id,
            "user_identifier": user_identifier,
            "user_ip": user_ip,
            "user_agent": user_agent,
            "upload_count": 1,
            "first_upload_at": datetime.utcnow(),
            "last_upload_at": datetime.utcnow(),
            "is_active": True
        }
        result = await user_uploads_collection.insert_one(upload_record)
        upload_record["_id"] = result.inserted_id
        return upload_record


async def get_session_user_count(session_id: str) -> int:
    """Get total number of unique users who uploaded to this session"""
    user_uploads_collection = get_user_uploads_collection()
    count = await user_uploads_collection.count_documents({"session_id": session_id})
    return count


async def get_session_upload_stats(session_id: str) -> list:
    """Get upload statistics for all users in a session"""
    user_uploads_collection = get_user_uploads_collection()
    cursor = user_uploads_collection.find({"session_id": session_id})
    stats = await cursor.to_list(length=None)
    return stats


async def update_session_photos_per_user_limit(session_id: str, new_limit: int) -> bool:
    """Update the photos per user limit for a session"""
    sessions_collection = get_sessions_collection()
    result = await sessions_collection.update_one(
        {"session_id": session_id},
        {"$set": {"photos_per_user_limit": new_limit}}
    )
    return result.modified_count > 0
