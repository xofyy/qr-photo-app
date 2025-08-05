import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { logger } from '../utils/logger';

const useDashboardWebSocket = (userSessions) => {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const [connectedSessions, setConnectedSessions] = useState(new Set());
  const websocketsRef = useRef(new Map()); // sessionId -> WebSocket

  const connectToSession = useCallback((sessionId) => {
    if (!sessionId || !isAuthenticated || !user || websocketsRef.current.has(sessionId)) {
      return;
    }

    // Determine WebSocket URL based on environment
    let wsUrl;
    if (process.env.NODE_ENV === 'production') {
      // Use backend WebSocket URL from environment variable
      const backendWsUrl = process.env.REACT_APP_WS_URL || process.env.REACT_APP_API_URL?.replace('http', 'ws');
      if (backendWsUrl) {
        wsUrl = `${backendWsUrl}/ws/${sessionId}?user_id=${user.user_id}`;
      } else {
        console.error('Dashboard WebSocket URL not configured for production');
        return;
      }
    } else {
      // Development - use localhost
      wsUrl = `ws://localhost:8001/ws/${sessionId}?user_id=${user.user_id}`;
    }
    
    logger.websocket.connect('Dashboard WebSocket URL:', wsUrl);
    
    logger.websocket.connect('Dashboard connecting to session:', sessionId);

    try {
      const ws = new WebSocket(wsUrl);
      websocketsRef.current.set(sessionId, ws);

      ws.onopen = () => {
        logger.websocket.connect('Dashboard connected to session:', sessionId);
        setConnectedSessions(prev => new Set([...prev, sessionId]));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          logger.websocket.message('Dashboard message from session', sessionId, ':', data);
          
          // Add notification for photo uploads
          if (data.type === 'photo_uploaded') {
            addNotification(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        logger.websocket.disconnect('Dashboard disconnected from session:', sessionId);
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