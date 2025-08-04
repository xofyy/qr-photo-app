import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getSessionPhotos } from '../services/api';

const useWebSocketWithFallback = (sessionId) => {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const websocketRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const lastPhotoCountRef = useRef(0);
  const maxReconnectAttempts = 3; // Reduced for faster fallback

  const startPolling = useCallback(() => {
    if (!sessionId || !isAuthenticated || !user || isPolling) {
      return;
    }

    console.log('Starting polling fallback for notifications');
    setIsPolling(true);

    const poll = async () => {
      try {
        const response = await getSessionPhotos(sessionId);
        const currentPhotoCount = response.data.length;
        
        // Check if new photos were added
        if (lastPhotoCountRef.current > 0 && currentPhotoCount > lastPhotoCountRef.current) {
          const newPhotosCount = currentPhotoCount - lastPhotoCountRef.current;
          addNotification({
            type: 'photo_uploaded',
            session_id: sessionId,
            message: `${newPhotosCount} new photo${newPhotosCount > 1 ? 's' : ''} uploaded`,
            upload_count: currentPhotoCount,
            uploaded_by: 'Unknown user'
          });
        }
        
        lastPhotoCountRef.current = currentPhotoCount;
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll to get current count
    poll();
    
    // Set up polling interval (every 10 seconds)
    pollingIntervalRef.current = setInterval(poll, 10000);
  }, [sessionId, isAuthenticated, user, addNotification, isPolling]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    console.log('Stopped polling fallback');
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!sessionId || !isAuthenticated || !user) {
      console.log('WebSocket connection skipped - not authenticated or no session');
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
        console.error('WebSocket URL not configured for production, falling back to polling');
        startPolling();
        return;
      }
    } else {
      // Development - use localhost
      wsUrl = `ws://localhost:8001/ws/${sessionId}?user_id=${user.user_id}`;
    }
    
    console.log('Attempting WebSocket connection:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout, falling back to polling');
          ws.close();
          startPolling();
        }
      }, 5000); // 5 second timeout

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        stopPolling(); // Stop polling if WebSocket works
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Add notification for display (skip connection messages)
          if (data.type !== 'connected' && data.type !== 'owner_connected' && data.type !== 'echo') {
            addNotification(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        websocketRef.current = null;

        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const timeout = Math.pow(2, reconnectAttemptsRef.current) * 1000; // Exponential backoff
          console.log(`Attempting WebSocket reconnect in ${timeout}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, timeout);
        } else {
          console.log('Max WebSocket reconnect attempts reached, falling back to polling');
          startPolling();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeout);
        
        // Immediately fall back to polling on error
        if (reconnectAttemptsRef.current >= maxReconnectAttempts - 1) {
          console.log('WebSocket error, falling back to polling');
          startPolling();
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      startPolling();
    }
  }, [sessionId, isAuthenticated, user, addNotification, startPolling, stopPolling]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Component unmounting');
      websocketRef.current = null;
    }

    stopPolling();
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, [stopPolling]);

  const sendMessage = useCallback((message) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return disconnect;
  }, [connectWebSocket, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: isConnected || isPolling,
    isWebSocketConnected: isConnected,
    isPollingActive: isPolling,
    connectionType: isConnected ? 'websocket' : (isPolling ? 'polling' : 'disconnected'),
    sendMessage,
    connect: connectWebSocket,
    disconnect
  };
};

export default useWebSocketWithFallback;