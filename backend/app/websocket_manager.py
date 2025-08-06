from typing import Dict, List, Set
from fastapi import WebSocket
import json
import asyncio
from datetime import datetime, timedelta
from app.utils.logger import safe_log

class WebSocketManager:
    def __init__(self):
        # Session ID -> Dict of user_id -> WebSocket connections (for owner-only notifications)
        self.session_connections: Dict[str, Dict[str, WebSocket]] = {}
        # WebSocket -> (Session ID, User ID) mapping for cleanup
        self.connection_mapping: Dict[WebSocket, tuple] = {}
        # WebSocket -> last ping timestamp for heartbeat monitoring
        self.connection_heartbeat: Dict[WebSocket, datetime] = {}
        # Message sequence numbers for each connection
        self.connection_sequences: Dict[WebSocket, int] = {}
    
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
        
        # Initialize heartbeat and sequence tracking
        self.connection_heartbeat[websocket] = datetime.utcnow()
        self.connection_sequences[websocket] = 0
    
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
            
            # Clean up heartbeat and sequence tracking
            self.connection_heartbeat.pop(websocket, None)
            self.connection_sequences.pop(websocket, None)
            
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
        notification_data = {
            "type": "photo_uploaded",
            "session_id": session_id,
            "data": {
                "filename": photo_data.get("filename"),
                "url": photo_data.get("url"),
                "upload_count": photo_data.get("upload_count", 0),
                "uploaded_by": photo_data.get("uploaded_by")
            }
        }
        
        if session_id not in self.session_connections:
            safe_log(f"No connections found for session {session_id}", 'debug')
            return
        
        if owner_id not in self.session_connections[session_id]:
            safe_log(f"Session owner {owner_id} not connected to session {session_id}", 'debug')
            return
            
        websocket = self.session_connections[session_id][owner_id]
        
        try:
            await self.send_enhanced_message(notification_data, websocket, require_ack=True)
            safe_log(f"Photo upload notification sent to session owner {owner_id} for session {session_id}", 'debug')
        except Exception as e:
            safe_log(f"Error sending photo upload notification to owner: {e}", 'error')
            self.disconnect(websocket)
    
    def get_session_connection_count(self, session_id: str) -> int:
        """Get number of active connections for a session"""
        return len(self.session_connections.get(session_id, {}))
    
    def update_heartbeat(self, websocket: WebSocket):
        """Update last heartbeat timestamp for a connection"""
        if websocket in self.connection_heartbeat:
            self.connection_heartbeat[websocket] = datetime.utcnow()
    
    def get_next_sequence(self, websocket: WebSocket) -> int:
        """Get next sequence number for a connection"""
        if websocket in self.connection_sequences:
            self.connection_sequences[websocket] += 1
            return self.connection_sequences[websocket]
        return 0
    
    async def send_enhanced_message(self, message_data: dict, websocket: WebSocket, require_ack: bool = False):
        """Send enhanced message with sequence number and timestamp"""
        try:
            # Add metadata to message
            enhanced_message = {
                **message_data,
                "sequence": self.get_next_sequence(websocket),
                "timestamp": datetime.utcnow().isoformat(),
                "ack_required": require_ack
            }
            
            message_str = json.dumps(enhanced_message)
            await websocket.send_text(message_str)
            
            # Update heartbeat when sending message
            self.update_heartbeat(websocket)
            
        except Exception as e:
            safe_log(f"Error sending enhanced message: {e}", 'error')
            self.disconnect(websocket)
    
    def get_stale_connections(self, timeout_minutes: int = 5) -> List[WebSocket]:
        """Get connections that haven't sent heartbeat in specified minutes"""
        stale_connections = []
        cutoff_time = datetime.utcnow() - timedelta(minutes=timeout_minutes)
        
        for websocket, last_heartbeat in self.connection_heartbeat.items():
            if last_heartbeat < cutoff_time:
                stale_connections.append(websocket)
                
        return stale_connections
    
    async def cleanup_stale_connections(self, timeout_minutes: int = 5):
        """Clean up stale connections that haven't sent heartbeat"""
        stale_connections = self.get_stale_connections(timeout_minutes)
        
        for websocket in stale_connections:
            safe_log(f"Cleaning up stale WebSocket connection", 'debug')
            try:
                await websocket.close(code=1001, reason="Connection timeout")
            except:
                pass  # Connection might already be closed
            finally:
                self.disconnect(websocket)

# Global WebSocket manager instance
websocket_manager = WebSocketManager()