import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';

/**
 * Centralized WebSocket manager for Layout-based architecture
 * This is the SINGLE source of truth for all WebSocket connections
 */
class WebSocketConnectionManager {
  constructor() {
    this.connections = new Map(); // sessionId -> WebSocket
    this.connectionStates = new Map(); // sessionId -> 'connecting' | 'connected' | 'error' | 'disconnected'
    this.messageHandlers = new Set();
    this.pendingConnections = new Set();
    this.lastMessages = new Map(); // sessionId -> lastMessage
    this.pendingAcks = new Map(); // sessionId -> Set of sequence numbers awaiting ACK
    
    // Connection pool settings
    this.MAX_CONNECTIONS = 3;
    this.connectionPriority = new Map(); // sessionId -> priority score
  }

  // Add message handler
  addMessageHandler(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  // Broadcast message to all handlers
  broadcastMessage(message) {
    this.lastMessages.set(message.session_id, message);
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  // Get WebSocket URL
  getWebSocketUrl() {
    if (process.env.NODE_ENV === 'production') {
      const backendWsUrl = process.env.REACT_APP_WS_URL || process.env.REACT_APP_API_URL?.replace('http', 'ws');
      return backendWsUrl || null;
    } else {
      return 'ws://localhost:8001';
    }
  }

  // Check if session is connected
  isConnected(sessionId) {
    return this.connectionStates.get(sessionId) === 'connected';
  }

  // Connect to a session
  async connectToSession(sessionId, priority = 50) {
    // Prevent duplicate connection attempts
    if (this.pendingConnections.has(sessionId)) {
      logger.websocket.connect(`Already attempting connection to ${sessionId}, waiting...`);
      return this.waitForConnection(sessionId);
    }

    // If already connected, just update priority
    if (this.isConnected(sessionId)) {
      this.connectionPriority.set(sessionId, priority);
      logger.websocket.connect(`Already connected to session ${sessionId}, updated priority to ${priority}`);
      return this.connections.get(sessionId);
    }

    // Check connection limit and evict if necessary
    await this.enforceConnectionLimit();

    this.pendingConnections.add(sessionId);
    this.connectionPriority.set(sessionId, priority);

    try {
      const wsUrl = this.getWebSocketUrl();
      const token = localStorage.getItem('auth_token');
      
      if (!wsUrl || !token) {
        throw new Error('Missing WebSocket URL or auth token');
      }

      const fullWsUrl = `${wsUrl}/ws/${sessionId}?token=${encodeURIComponent(token)}`;
      
      logger.websocket.connect(`Layout connecting to session: ${sessionId} (priority: ${priority})`);
      
      this.connectionStates.set(sessionId, 'connecting');
      
      const ws = new WebSocket(fullWsUrl);
      
      ws.onopen = () => {
        logger.websocket.connect(`Layout connected to session: ${sessionId}`);
        this.connections.set(sessionId, ws);
        this.connectionStates.set(sessionId, 'connected');
        this.pendingConnections.delete(sessionId);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          logger.websocket.message(`Layout received message for ${sessionId}:`, message);
          
          // Handle ACK messages
          if (message.type === 'ack' && message.sequence) {
            this.handleAck(sessionId, message.sequence);
            return;
          }
          
          // Send ACK if required
          if (message.ack_required && message.sequence) {
            this.sendAck(ws, message.sequence);
          }
          
          this.broadcastMessage({ ...message, session_id: sessionId });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        logger.websocket.disconnect(`Layout connection closed for ${sessionId}: ${event.code}`);
        this.connections.delete(sessionId);
        this.connectionStates.set(sessionId, 'disconnected');
        this.pendingConnections.delete(sessionId);
        
        // Auto-reconnect if not intentional disconnect
        if (event.code !== 1000 && this.connectionPriority.has(sessionId)) {
          setTimeout(() => {
            const currentPriority = this.connectionPriority.get(sessionId);
            if (currentPriority > 0) { // Only reconnect if still has priority
              this.connectToSession(sessionId, currentPriority);
            }
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        logger.websocket.error(`Layout WebSocket error for ${sessionId}:`, error);
        this.connectionStates.set(sessionId, 'error');
        this.pendingConnections.delete(sessionId);
      };

      return ws;
    } catch (error) {
      console.error(`Error connecting to session ${sessionId}:`, error);
      this.connectionStates.set(sessionId, 'error');
      this.pendingConnections.delete(sessionId);
      throw error;
    }
  }

  // Wait for pending connection
  async waitForConnection(sessionId, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkConnection = () => {
        if (this.isConnected(sessionId)) {
          resolve(this.connections.get(sessionId));
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Connection timeout for session ${sessionId}`));
        } else if (this.connectionStates.get(sessionId) === 'error') {
          reject(new Error(`Connection error for session ${sessionId}`));
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  // Enforce connection limit by evicting lowest priority connections
  async enforceConnectionLimit() {
    if (this.connections.size < this.MAX_CONNECTIONS) {
      return;
    }

    // Find lowest priority connection to evict
    let minPriority = Infinity;
    let evictSessionId = null;

    for (const [sessionId, priority] of this.connectionPriority.entries()) {
      if (this.isConnected(sessionId) && priority < minPriority) {
        minPriority = priority;
        evictSessionId = sessionId;
      }
    }

    if (evictSessionId) {
      logger.websocket.connect(`Evicting connection ${evictSessionId} (priority: ${minPriority}) to make room`);
      await this.disconnect(evictSessionId);
    }
  }

  // Disconnect from session
  async disconnect(sessionId) {
    const ws = this.connections.get(sessionId);
    if (ws) {
      ws.close(1000, 'Layout disconnect');
    }
    
    this.connections.delete(sessionId);
    this.connectionStates.set(sessionId, 'disconnected');
    this.connectionPriority.delete(sessionId);
    this.lastMessages.delete(sessionId);
    
    logger.websocket.disconnect(`Layout disconnected from session: ${sessionId}`);
  }

  // Send ACK for received message
  async sendAck(ws, sequence) {
    try {
      const ackMessage = {
        type: 'ack',
        sequence: sequence,
        timestamp: new Date().toISOString()
      };
      await ws.send(JSON.stringify(ackMessage));
      logger.websocket.message(`Sent ACK for sequence ${sequence}`);
    } catch (error) {
      console.error('Error sending ACK:', error);
    }
  }

  // Handle received ACK
  handleAck(sessionId, sequence) {
    const pending = this.pendingAcks.get(sessionId);
    if (pending && pending.has(sequence)) {
      pending.delete(sequence);
      logger.websocket.message(`Received ACK for sequence ${sequence} from session ${sessionId}`);
    }
  }

  // Get unacknowledged message count for session
  getUnackedCount(sessionId) {
    const pending = this.pendingAcks.get(sessionId);
    return pending ? pending.size : 0;
  }

  // Disconnect all connections
  async disconnectAll() {
    logger.websocket.disconnect('Layout disconnecting all connections');
    
    for (const [sessionId] of this.connections) {
      await this.disconnect(sessionId);
    }
    
    this.messageHandlers.clear();
    this.pendingAcks.clear();
  }

  // Get connection summary
  getConnectionSummary() {
    const connectedSessions = Array.from(this.connections.keys()).filter(id => this.isConnected(id));
    return {
      totalConnections: this.connections.size,
      connectedSessions: new Set(connectedSessions),
      isAnyConnected: connectedSessions.length > 0,
      connectionStates: new Map(this.connectionStates)
    };
  }
}

// Global instance
const globalConnectionManager = new WebSocketConnectionManager();

/**
 * Hook for Layout to manage WebSocket connections
 * Only Layout.js should use this hook
 */
export const useLayoutWebSocketManager = () => {
  const [connectionSummary, setConnectionSummary] = useState(() => 
    globalConnectionManager.getConnectionSummary()
  );

  // Update connection summary when connections change
  const updateSummary = useCallback(() => {
    setConnectionSummary(globalConnectionManager.getConnectionSummary());
  }, []);

  // Connect to multiple sessions with priorities
  const connectToSessions = useCallback(async (sessions) => {
    if (!sessions || sessions.length === 0) {
      return;
    }

    logger.websocket.connect(`Layout connecting to ${sessions.length} sessions`);

    // Connect with priorities: newest sessions get higher priority
    const promises = sessions.map((session, index) => {
      const priority = 100 - index * 10; // Higher priority for earlier sessions
      return globalConnectionManager.connectToSession(session.session_id, priority);
    });

    try {
      await Promise.allSettled(promises);
      updateSummary();
    } catch (error) {
      console.error('Error connecting to sessions:', error);
    }
  }, [updateSummary]);

  // Disconnect all connections
  const disconnectAll = useCallback(async () => {
    await globalConnectionManager.disconnectAll();
    updateSummary();
  }, [updateSummary]);

  // Add message handler
  const addMessageHandler = useCallback((handler) => {
    return globalConnectionManager.addMessageHandler(handler);
  }, []);

  // Monitor connection state changes
  useEffect(() => {
    const interval = setInterval(updateSummary, 1000);
    return () => clearInterval(interval);
  }, [updateSummary]);

  return {
    connectionSummary,
    connectToSessions,
    disconnectAll,
    addMessageHandler,
    manager: globalConnectionManager
  };
};

/**
 * Hook for components to consume WebSocket state (read-only)
 * All components should use this instead of managing connections
 */
export const useLayoutWebSocket = () => {
  const [summary, setSummary] = useState(() => 
    globalConnectionManager.getConnectionSummary()
  );
  const [lastMessage, setLastMessage] = useState(null);

  // Subscribe to connection state changes
  useEffect(() => {
    const updateSummary = () => {
      setSummary(globalConnectionManager.getConnectionSummary());
    };

    const interval = setInterval(updateSummary, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to messages
  useEffect(() => {
    const handleMessage = (message) => {
      setLastMessage(message);
    };

    const removeHandler = globalConnectionManager.addMessageHandler(handleMessage);
    return removeHandler;
  }, []);

  // Utility functions for components
  const isSessionConnected = useCallback((sessionId) => {
    return summary.connectedSessions.has(sessionId);
  }, [summary.connectedSessions]);

  const getSessionStatus = useCallback((sessionId) => {
    return summary.connectionStates.get(sessionId) || 'disconnected';
  }, [summary.connectionStates]);

  return {
    // Connection state
    isConnected: summary.isAnyConnected,
    connectedSessions: summary.connectedSessions,
    totalConnections: summary.totalConnections,
    
    // Status functions
    isSessionConnected,
    getSessionStatus,
    
    // Messages
    lastMessage,
    
    // Legacy compatibility
    connectionStatus: summary.isAnyConnected ? 'connected' : 'disconnected',
    connectionType: summary.isAnyConnected ? 'websocket' : 'disconnected',
    isPollingActive: false
  };
};