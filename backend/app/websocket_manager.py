from typing import Dict, List, Set
from fastapi import WebSocket
import json
import asyncio
from datetime import datetime
from app.utils.logger import safe_log

class WebSocketManager:
    def __init__(self):
        # Session ID -> Dict of user_id -> WebSocket connections (for owner-only notifications)
        self.session_connections: Dict[str, Dict[str, WebSocket]] = {}
        # WebSocket -> (Session ID, User ID) mapping for cleanup
        self.connection_mapping: Dict[WebSocket, tuple] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str, user_id: str = None):
        """Connect a WebSocket to a session room (only for session owners)"""
        await websocket.accept()
        
        # Initialize session if it doesn't exist
        if session_id not in self.session_connections:
            self.session_connections[session_id] = {}
        
        # Add connection to session (only if user_id provided - for owners)
        if user_id:
            self.session_connections[session_id][user_id] = websocket
            self.connection_mapping[websocket] = (session_id, user_id)
            safe_log(f"WebSocket connected to session {session_id} for user {user_id}", 'debug')
        else:
            # For anonymous users, don't store the connection (no notifications)
            self.connection_mapping[websocket] = (session_id, None)
            safe_log(f"WebSocket connected to session {session_id} (anonymous - no notifications)", 'debug')
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket and clean up"""
        if websocket in self.connection_mapping:
            session_id, user_id = self.connection_mapping[websocket]
            
            # Remove from session connections if user_id exists
            if user_id and session_id in self.session_connections:
                if user_id in self.session_connections[session_id]:
                    del self.session_connections[session_id][user_id]
                
                # Clean up empty sessions
                if not self.session_connections[session_id]:
                    del self.session_connections[session_id]
            
            # Remove from connection mapping
            del self.connection_mapping[websocket]
            
            safe_log(f"WebSocket disconnected from session {session_id} (user: {user_id or 'anonymous'})", 'debug')
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to a specific WebSocket"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            safe_log(f"Error sending personal message: {e}", 'error')
            self.disconnect(websocket)
    
    async def notify_session_owner(self, session_id: str, owner_id: str, message: dict):
        """Send notification only to session owner"""
        if session_id not in self.session_connections:
            safe_log(f"No connections found for session {session_id}", 'debug')
            return
        
        if owner_id not in self.session_connections[session_id]:
            safe_log(f"Session owner {owner_id} not connected to session {session_id}", 'debug')
            return
            
        websocket = self.session_connections[session_id][owner_id]
        message_str = json.dumps(message)
        
        try:
            await websocket.send_text(message_str)
            safe_log(f"Notification sent to session owner {owner_id} for session {session_id}", 'debug')
        except Exception as e:
            safe_log(f"Error sending notification to owner: {e}", 'error')
            self.disconnect(websocket)
    
    async def notify_photo_uploaded(self, session_id: str, owner_id: str, photo_data: dict):
        """Send photo upload notification to session owner only"""
        notification = {
            "type": "photo_uploaded",
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": session_id,
            "data": {
                "filename": photo_data.get("filename"),
                "url": photo_data.get("url"),
                "upload_count": photo_data.get("upload_count", 0),
                "uploaded_by": photo_data.get("uploaded_by")
            }
        }
        
        await self.notify_session_owner(session_id, owner_id, notification)
    
    def get_session_connection_count(self, session_id: str) -> int:
        """Get number of active connections for a session"""
        return len(self.session_connections.get(session_id, {}))

# Global WebSocket manager instance
websocket_manager = WebSocketManager()