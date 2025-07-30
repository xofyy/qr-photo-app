from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
import os
from os import getenv
import io
import cloudinary
import cloudinary.uploader
import uuid
from datetime import datetime, timedelta
from bson import ObjectId
import traceback
from starlette.requests import Request

from app import crud, schemas, utils
from app.database import get_database
from app.utils.user_identifier import generate_user_identifier, get_user_ip, get_user_agent
from app.utils.zip_generator import create_photos_zip, create_empty_session_zip
from app.auth import (
    oauth, create_access_token, get_current_user, require_authentication,
    get_google_user_info, generate_user_id, GOOGLE_CLIENT_ID, exchange_code_for_token
)
from app.schemas.user import UserCreate, UserResponse, Token

# Initialize Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Initialize FastAPI
app = FastAPI(title="QR Photo Session App", version="1.0.0")

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != [''] else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    pass

@app.on_event("shutdown")
async def shutdown_db_client():
    pass

# Authentication endpoints
@app.get("/auth/google")
async def google_login():
    """Initiate Google OAuth2 login"""
    redirect_uri = f"{os.getenv('BACKEND_URL', 'http://localhost:8001')}/auth/google/callback"
    
    # Build Google OAuth2 URL manually
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        "&response_type=code"
        "&scope=openid email profile"
        "&access_type=offline"
    )
    
    return RedirectResponse(url=auth_url)


@app.get("/auth/google/callback")
async def google_callback(code: str = None, error: str = None):
    """Handle Google OAuth2 callback"""
    try:
        print(f"OAuth callback received - code: {'YES' if code else 'NO'}, error: {error}")
        
        if error:
            print(f"OAuth error from Google: {error}")
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            return RedirectResponse(
                url=f"{frontend_url}/?error=auth_failed"
            )
        
        if not code:
            print("No authorization code received")
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            return RedirectResponse(
                url=f"{frontend_url}/?error=no_code"
            )
        
        print(f"Exchanging code for token...")
        # Exchange code for access token
        token_data = await exchange_code_for_token(code)
        print(f"Token exchange successful, got access_token: {'YES' if token_data.get('access_token') else 'NO'}")
        
        print(f"Getting user info from Google...")
        user_data = await get_google_user_info(token_data['access_token'])
        print(f"User data received: {user_data.email}")
        
        print(f"Checking if user exists...")
        # Check if user already exists
        existing_user = await crud.get_user_by_provider_id("google", user_data.id)
        
        if existing_user:
            print(f"Existing user found: {existing_user['email']}")
            # Update last login
            await crud.update_user_last_login(existing_user["user_id"])
            user = existing_user
        else:
            print(f"Creating new user...")
            # Create new user
            user_create = UserCreate(
                email=user_data.email,
                name=user_data.name,
                avatar_url=user_data.picture,
                provider="google",
                provider_id=user_data.id
            )
            user = await crud.create_user(user_create)
            print(f"New user created: {user['email']}")
        
        print(f"Creating JWT token...")
        # Create JWT token
        access_token = create_access_token(data={
            "sub": user["user_id"], 
            "email": user["email"]
        })
        
        print(f"Redirecting to frontend with token...")
        # Redirect to frontend with token
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(
            url=f"{frontend_url}/auth/callback?token={access_token}"
        )
        
    except Exception as e:
        print(f"OAuth callback error: {e}")
        print(traceback.format_exc())
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(
            url=f"{frontend_url}/auth/error?error=oauth_failed"
        )


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(require_authentication)):
    """Get current authenticated user information"""
    return current_user


@app.post("/auth/logout")
async def logout():
    """Logout endpoint (client-side token removal)"""
    return {"message": "Logged out successfully"}


# Session endpoints - updated to support user ownership
@app.post("/sessions/")
async def create_session(current_user: UserResponse = Depends(get_current_user)):
    try:
        # Create session with default values
        session_create = schemas.SessionCreate(max_photos=10, photos_per_user_limit=10)
        
        if current_user:
            # Create session with owner information
            db_session = await crud.create_session_with_owner(
                session=session_create,
                owner_id=current_user.user_id,
                owner_name=current_user.name
            )
        else:
            # Create anonymous session (fallback)
            db_session = await crud.create_session(session=session_create)
        
        # Convert ObjectId to string for JSON serialization
        if "_id" in db_session:
            db_session["_id"] = str(db_session["_id"])
            
        return db_session
    except Exception as e:
        print(f"Error creating session: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    try:
        db_session = await crud.get_session(session_id=session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        
        # Convert ObjectId to string for JSON serialization
        if "_id" in db_session:
            db_session["_id"] = str(db_session["_id"])
        return db_session
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting session {session_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")

@app.get("/sessions/{session_id}/qr")
async def get_qr_code(session_id: str):
    try:
        db_session = await crud.get_session(session_id=session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Generate QR code with the session URL
        qr_data = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/session/{session_id}"
        qr_code = utils.generate_qr_code(qr_data)
        
        return {"qr_code": qr_code, "session_url": qr_data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating QR code: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate QR code: {str(e)}")

@app.post("/sessions/{session_id}/photos")
async def upload_photo(
    session_id: str,
    file: UploadFile = File(..., description="Image file (max 10MB)"),
    request: Request = None
):
    try:
        # Validate session ID format (UUID)
        try:
            uuid.UUID(session_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid session ID format")
            
        print(f"Attempting to upload photo for session: {session_id}")
        print(f"File details: {file.filename}, {file.content_type}")
        
        # Check if session exists
        db_session = await crud.get_session(session_id=session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        
        print(f"Session found: {db_session}")
        
        # Check if session is active
        if not db_session.get("is_active", True):
            raise HTTPException(status_code=400, detail="Session is inactive")
        
        # Generate user identifier for this anonymous user
        user_identifier = generate_user_identifier(request, session_id)
        user_ip = get_user_ip(request)
        user_agent = get_user_agent(request)
        
        print(f"User identifier: {user_identifier}")
        
        # Get user's current upload count
        user_upload_stats = await crud.get_user_upload_stats(session_id, user_identifier)
        current_user_uploads = user_upload_stats["upload_count"] if user_upload_stats else 0
        
        # Check per-user photo limit
        photos_per_user_limit = db_session.get("photos_per_user_limit", 10)
        
        print(f"User uploads: {current_user_uploads}, Per-user limit: {photos_per_user_limit}")
        
        if current_user_uploads >= photos_per_user_limit:
            raise HTTPException(
                status_code=400, 
                detail=f"You have reached your photo limit ({photos_per_user_limit} photos per user). You have uploaded {current_user_uploads} photos."
            )
        
        # Check if file is provided
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read file content properly
        contents = await file.read()
        file_size = len(contents)
        print(f"File size: {file_size} bytes")
        
        # File size validation (10MB limit)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Empty file provided")
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_FILE_SIZE//1024//1024}MB")
        
        # Validate filename
        if not file.filename or len(file.filename) > 255:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        # Validate that it's an image file
        allowed_content_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_content_types:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed types: {allowed_content_types}")
        
        # Upload to Cloudinary
        try:
            print("Uploading to Cloudinary...")
            # Upload to Cloudinary with folder structure
            folder_name = f"qr_sessions/{session_id}"
            result = cloudinary.uploader.upload(
                contents,
                folder=folder_name,
                public_id=f"{uuid.uuid4()}_{file.filename.split('.')[0]}",
                resource_type="image"
            )
            print(f"Cloudinary upload result: {result}")
            
        except Exception as cloudinary_error:
            print(f"Cloudinary upload error: {cloudinary_error}")
            print(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Failed to upload to Cloudinary: {str(cloudinary_error)}")
        
        # Save photo record to database
        try:
            photo_data = schemas.PhotoCreate(
                filename=result["public_id"], 
                session_id=session_id,
                url=result["secure_url"]
            )
            db_photo = await crud.create_photo(photo=photo_data)
            print(f"Photo record created: {db_photo}")
            
        except Exception as db_error:
            print(f"Database error: {db_error}")
            print(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Failed to save photo record: {str(db_error)}")
        
        # Increment photo count (legacy - keep for backward compatibility)
        try:
            await crud.increment_photo_count(session_id)
            print(f"Photo count incremented for session: {session_id}")
        except Exception as count_error:
            print(f"Error incrementing photo count: {count_error}")
            print(traceback.format_exc())
        
        # Record user upload for per-user tracking
        try:
            await crud.create_or_update_user_upload(
                session_id=session_id,
                user_identifier=user_identifier,
                user_ip=user_ip,
                user_agent=user_agent
            )
            print(f"User upload recorded for: {user_identifier}")
        except Exception as user_error:
            print(f"Error recording user upload: {user_error}")
            print(traceback.format_exc())
        
        # Convert ObjectId to string
        if "_id" in db_photo:
            db_photo["_id"] = str(db_photo["_id"])
        
        return {
            "filename": result["public_id"], 
            "url": result["secure_url"], 
            "photo": db_photo
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"General upload error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/sessions/{session_id}/photos")
async def get_session_photos(session_id: str):
    try:
        db_session = await crud.get_session(session_id=session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        photos = await crud.get_photos_by_session(session_id=session_id)
        
        # Prepare photo data with URLs
        photo_data = []
        for photo in photos:
            photo_data.append({
                "id": str(photo["_id"]) if "_id" in photo else str(photo.get("id", "")),
                "filename": photo["filename"],
                "url": photo.get("url", f"https://res.cloudinary.com/{os.getenv('CLOUDINARY_CLOUD_NAME')}/{photo['filename']}"),
                "uploaded_at": photo["uploaded_at"]
            })
        
        return photo_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting session photos: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get session photos: {str(e)}")

# Admin endpoints
@app.get("/admin/sessions/")
async def get_all_sessions():
    try:
        sessions = await crud.get_all_sessions()
        # Convert ObjectId to string for all sessions
        for session in sessions:
            if "_id" in session:
                session["_id"] = str(session["_id"])
        return sessions
    except Exception as e:
        print(f"Error getting all sessions: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")


@app.get("/user/sessions/")
async def get_user_sessions(current_user: UserResponse = Depends(require_authentication)):
    """Get all sessions owned by the current user"""
    try:
        sessions = await crud.get_sessions_by_owner(current_user.user_id)
        # Convert ObjectId to string for all sessions
        for session in sessions:
            if "_id" in session:
                session["_id"] = str(session["_id"])
        return sessions
    except Exception as e:
        print(f"Error getting user sessions: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get user sessions: {str(e)}")


# Admin endpoints for photo limit management
@app.patch("/admin/sessions/{session_id}/photo-limit")
async def update_session_photo_limit(
    session_id: str,
    new_limit: int,
    current_user: UserResponse = Depends(require_authentication)
):
    """Update the photos per user limit for a specific session"""
    try:
        # Validate the new limit
        if new_limit < 1 or new_limit > 100:
            raise HTTPException(status_code=400, detail="Photo limit must be between 1 and 100")
        
        # Check if session exists
        db_session = await crud.get_session(session_id=session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        
        # Update the limit
        success = await crud.update_session_photos_per_user_limit(session_id, new_limit)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update photo limit")
        
        return {
            "message": f"Successfully updated photo limit to {new_limit} photos per user",
            "session_id": session_id,
            "new_limit": new_limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating session photo limit: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to update photo limit: {str(e)}")


@app.get("/admin/sessions/{session_id}/user-stats")
async def get_session_user_stats(
    session_id: str,
    current_user: UserResponse = Depends(require_authentication)
):
    """Get upload statistics for all users in a session"""
    try:
        # Check if session exists
        db_session = await crud.get_session(session_id=session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        
        # Get user upload stats
        user_stats = await crud.get_session_upload_stats(session_id)
        total_users = await crud.get_session_user_count(session_id)
        photos_per_user_limit = db_session.get("photos_per_user_limit", 10)
        
        # Format the response
        formatted_stats = []
        for stat in user_stats:
            formatted_stats.append({
                "user_identifier": stat["user_identifier"][:16] + "..." if len(stat["user_identifier"]) > 16 else stat["user_identifier"],
                "upload_count": stat["upload_count"],
                "remaining_uploads": max(0, photos_per_user_limit - stat["upload_count"]),
                "first_upload_at": stat["first_upload_at"],
                "last_upload_at": stat["last_upload_at"],
                "user_ip": stat.get("user_ip", "unknown")
            })
        
        return {
            "session_id": session_id,
            "total_unique_users": total_users,
            "photos_per_user_limit": photos_per_user_limit,
            "user_stats": formatted_stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting session user stats: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")


@app.get("/sessions/{session_id}/my-stats")
async def get_my_upload_stats(
    session_id: str,
    request: Request = None
):
    """Get upload statistics for the current user (anonymous)"""
    try:
        # Check if session exists
        db_session = await crud.get_session(session_id=session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        
        # Generate user identifier
        user_identifier = generate_user_identifier(request, session_id)
        
        # Get user's upload stats
        user_upload_stats = await crud.get_user_upload_stats(session_id, user_identifier)
        current_uploads = user_upload_stats["upload_count"] if user_upload_stats else 0
        photos_per_user_limit = db_session.get("photos_per_user_limit", 10)
        
        return {
            "session_id": session_id,
            "upload_count": current_uploads,
            "remaining_uploads": max(0, photos_per_user_limit - current_uploads),
            "photos_per_user_limit": photos_per_user_limit,
            "can_upload": current_uploads < photos_per_user_limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user stats: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")


@app.get("/sessions/{session_id}/download")
async def download_session_photos(
    session_id: str,
    current_user: UserResponse = Depends(require_authentication)
):
    """Download all photos from a session as a ZIP file (session owners only)"""
    try:
        # Check if session exists
        db_session = await crud.get_session(session_id=session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        
        # Check if current user is the owner of this session
        if db_session.get("owner_id") != current_user.user_id:
            raise HTTPException(status_code=403, detail="Only session owners can download photos")
        
        # Get all photos from the session
        photos = await crud.get_photos_by_session(session_id=session_id)
        
        if not photos:
            # Create empty ZIP if no photos
            zip_buffer = create_empty_session_zip(session_id)
            filename = f"session_{session_id}_photos_empty.zip"
        else:
            # Create ZIP with all photos
            zip_buffer = await create_photos_zip(photos, session_id)
            filename = f"session_{session_id}_photos_{len(photos)}_items.zip"
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(zip_buffer.read()),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error downloading session photos: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to download photos: {str(e)}")


@app.delete("/admin/sessions/{session_id}")
async def delete_session(session_id: str, current_user: UserResponse = Depends(require_authentication)):
    try:
        db_session = await crud.get_session(session_id=session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check if current user is the owner of this session
        if db_session.get("owner_id") != current_user.user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own sessions")
        
        # Delete photos from Cloudinary
        photos = await crud.get_photos_by_session(session_id=session_id)
        for photo in photos:
            try:
                cloudinary.uploader.destroy(photo["filename"])
            except Exception as e:
                print(f"Failed to delete {photo['filename']} from Cloudinary: {e}")
        
        # Delete from database
        success = await crud.delete_session(session_id)
        
        if success:
            return {"message": "Session deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete session")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting session: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")
