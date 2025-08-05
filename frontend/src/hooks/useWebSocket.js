import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { logger } from '../utils/logger';

const useWebSocket = (sessionId) => {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const [isConnected, setIsConnected] = useState(false);
  const websocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;


  const connect = useCallback(() => {
    if (!sessionId || !isAuthenticated || !user) {
      logger.debug('WebSocket connection skipped - not authenticated or no session');
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
        console.error('WebSocket URL not configured for production');
        return;
      }
    } else {
      // Development - use localhost
      wsUrl = `ws://localhost:8001/ws/${sessionId}?user_id=${user.user_id}`;
    }
    
    // WebSocket URL logged only in debug mode
    
    logger.websocket.connect('Connecting as authenticated user:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        logger.websocket.connect('Connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          logger.websocket.message('Message received:', data);
          
          // Add notification for display (skip connection messages)
          if (data.type !== 'connected' && data.type !== 'owner_connected' && data.type !== 'echo') {
            addNotification(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        logger.websocket.disconnect('Disconnected:', event.code, event.reason);
        setIsConnected(false);
        websocketRef.current = null;

        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const timeout = Math.pow(2, reconnectAttemptsRef.current) * 1000; // Exponential backoff
          logger.websocket.connect(`Reconnecting in ${timeout}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, timeout);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [sessionId, isAuthenticated, user, addNotification]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Component unmounting');
      websocketRef.current = null;
    }

    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    sendMessage,
    connect,
    disconnect
  };
};

export default useWebSocket;