// Global SSE Context for real-time updates across all pages
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import SSEService from '../services/sseService';

const SSEContext = createContext();

export const useSSE = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSE must be used within an SSEProvider');
  }
  return context;
};

export const SSEProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [eventListeners, setEventListeners] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const connectionAttemptRef = useRef(false);
  const eventListenersRef = useRef({});

  // Handle page visibility changes to manage SSE connections
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUserId && !isConnected) {
        connectSSE(currentUserId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUserId, isConnected]);

  // Subscribe to specific event types
  const addEventListener = useCallback((eventType, callback) => {
    setEventListeners(prev => {
      const newListeners = {
        ...prev,
        [eventType]: [...(prev[eventType] || []), callback]
      };
      eventListenersRef.current = newListeners; // Keep ref in sync
      return newListeners;
    });

    // Return cleanup function
    return () => {
      setEventListeners(prev => {
        const newListeners = {
          ...prev,
          [eventType]: (prev[eventType] || []).filter(cb => cb !== callback)
        };
        eventListenersRef.current = newListeners; // Keep ref in sync
        return newListeners;
      });
    };
  }, []);

  // Handle SSE messages and dispatch to listeners
  const handleSSEMessage = useCallback(async (event) => {
    if (!event.data) return;

    try {
      const data = JSON.parse(event.data);
      setLastMessage(data);

      // Handle keepalive pings
      if (data.type === 'ping') {
        return;
      }

      // Handle shutdown signal
      if (data.type === 'shutdown') {
        return;
      }

      // Use the ref to get current listeners (not stale closure)
      const currentListeners = eventListenersRef.current;
      const listeners = currentListeners[data.type] || [];
      
      for (const listener of listeners) {
        try {
          await listener(data);
        } catch (error) {
          console.error(`Error in SSE listener for ${data.type}:`, error);
        }
      }

      // Also dispatch to 'all' listeners
      const allListeners = currentListeners['all'] || [];
      for (const listener of allListeners) {
        try {
          await listener(data);
        } catch (error) {
          console.error("Error in SSE 'all' listener:", error);
        }
      }

    } catch (error) {
      console.error("Global SSE: Error processing message:", error);
    }
  }, []); // Remove eventListeners dependency since we use ref

  const handleSSEError = useCallback((error) => {
    console.error("Global SSE: Connection error:", error);
    
    // Only mark as disconnected if the connection is actually closed
    if (SSEService.eventSource?.readyState === 2) { // CLOSED
      setIsConnected(false);
    }
  }, []);

  // Disconnect SSE
  const disconnectSSE = useCallback(() => {
    connectionAttemptRef.current = false;
    SSEService.disconnect();
    setCurrentUserId(null);
    setIsConnected(false);
  }, []);

  // Connect SSE when user is available - use refs to avoid recreating the function
  const connectSSE = useCallback((userId) => {
    // Prevent duplicate connections for the same user
    if (currentUserId === userId && isConnected) {
      console.log(`SSEContext: Already connected to user ${userId}`);
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (connectionAttemptRef.current) {
      console.log(`SSEContext: Connection attempt already in progress for user ${userId}`);
      return;
    }

    console.log(`SSEContext: Starting connection for user ${userId}`);
    connectionAttemptRef.current = true;

    // Disconnect any existing connection first
    if (currentUserId && currentUserId !== userId) {
      console.log(`SSEContext: Disconnecting existing connection for user ${currentUserId}`);
      SSEService.disconnect();
      setIsConnected(false);
      setCurrentUserId(null);
    }
    
    // Small delay to ensure any previous connection is fully closed
    setTimeout(() => {
      try {
        SSEService.connect(userId, handleSSEMessage, handleSSEError);
        setCurrentUserId(userId);
        setIsConnected(true);
        console.log(`SSEContext: Connected successfully to user ${userId}`);
      } finally {
        connectionAttemptRef.current = false;
      }
    }, 100);
  }, [currentUserId, isConnected, handleSSEMessage, handleSSEError]);

  // Handle page visibility changes to manage SSE connections
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only reconnect if we had a user and the connection was lost
      if (document.visibilityState === 'visible' && currentUserId && !isConnected) {
        setTimeout(() => {
          connectSSE(currentUserId);
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUserId, isConnected]); // Removed connectSSE to prevent recreating the handler

  const value = {
    isConnected,
    lastMessage,
    addEventListener,
    connectSSE,
    disconnectSSE
  };

  return (
    <SSEContext.Provider value={value}>
      {children}
    </SSEContext.Provider>
  );
};