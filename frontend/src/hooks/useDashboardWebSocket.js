import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const useDashboardWebSocket = (userSessions) => {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const [connectedSessions, setConnectedSessions] = useState(new Set());
  const websocketsRef = useRef(new Map()); // sessionId -> WebSocket

  const connectToSession = useCallback((sessionId) => {
    if (!sessionId || !isAuthenticated || !user || websocketsRef.current.has(sessionId)) {
      return;
    }

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? window.location.host.replace(':3000', ':8001')
      : 'localhost:8001';
    
    const wsUrl = `${protocol}//${host}/ws/${sessionId}?user_id=${user.user_id}`;
    
    console.log('Dashboard WebSocket connecting to session:', sessionId);

    try {
      const ws = new WebSocket(wsUrl);
      websocketsRef.current.set(sessionId, ws);

      ws.onopen = () => {
        console.log('Dashboard WebSocket connected to session:', sessionId);
        setConnectedSessions(prev => new Set([...prev, sessionId]));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Dashboard WebSocket message from session', sessionId, ':', data);
          
          // Add notification for photo uploads
          if (data.type === 'photo_uploaded') {
            addNotification(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('Dashboard WebSocket disconnected from session:', sessionId);
        websocketsRef.current.delete(sessionId);
        setConnectedSessions(prev => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });

        // Attempt to reconnect after delay (if session still exists)
        if (userSessions?.some(s => s.session_id === sessionId)) {
          setTimeout(() => {
            connectToSession(sessionId);
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('Dashboard WebSocket error for session', sessionId, ':', error);
      };

    } catch (error) {
      console.error('Error creating Dashboard WebSocket connection:', error);
    }
  }, [isAuthenticated, user, addNotification, userSessions]);

  const disconnectFromSession = useCallback((sessionId) => {
    const ws = websocketsRef.current.get(sessionId);
    if (ws) {
      ws.close(1000, 'Disconnecting from session');
      websocketsRef.current.delete(sessionId);
      setConnectedSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  }, []);

  const disconnectAll = useCallback(() => {
    websocketsRef.current.forEach((ws, sessionId) => {
      ws.close(1000, 'Disconnecting all');
    });
    websocketsRef.current.clear();
    setConnectedSessions(new Set());
  }, []);

  // Connect to all user sessions when they change
  useEffect(() => {
    if (!userSessions || !isAuthenticated || !user) {
      return;
    }

    // Connect to new sessions
    userSessions.forEach(session => {
      if (!websocketsRef.current.has(session.session_id)) {
        connectToSession(session.session_id);
      }
    });

    // Disconnect from sessions that no longer exist
    const currentSessionIds = new Set(userSessions.map(s => s.session_id));
    websocketsRef.current.forEach((ws, sessionId) => {
      if (!currentSessionIds.has(sessionId)) {
        disconnectFromSession(sessionId);
      }
    });
  }, [userSessions, isAuthenticated, user, connectToSession, disconnectFromSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectAll();
    };
  }, [disconnectAll]);

  return {
    connectedSessions,
    connectToSession,
    disconnectFromSession,
    disconnectAll
  };
};

export default useDashboardWebSocket;