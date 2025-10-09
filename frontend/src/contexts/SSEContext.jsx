// Global SSE Context for real-time updates across all pages
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  // Subscribe to specific event types
  const addEventListener = useCallback((eventType, callback) => {
    setEventListeners(prev => ({
      ...prev,
      [eventType]: [...(prev[eventType] || []), callback]
    }));

    // Return cleanup function
    return () => {
      setEventListeners(prev => ({
        ...prev,
        [eventType]: (prev[eventType] || []).filter(cb => cb !== callback)
      }));
    };
  }, []);

  // Handle SSE messages and dispatch to listeners
  const handleSSEMessage = useCallback(async (event) => {
    if (!event.data) return;

    try {
      console.log("Global SSE: Message received:", event.data);
      const data = JSON.parse(event.data);
      
      setLastMessage(data);

      // Handle keepalive pings
      if (data.type === 'ping') {
        console.log("Global SSE: Received keepalive ping");
        return;
      }

      // Handle shutdown signal
      if (data.type === 'shutdown') {
        console.log("Global SSE: Server is shutting down, will reconnect automatically");
        return;
      }

      // Dispatch to registered listeners
      const listeners = eventListeners[data.type] || [];
      for (const listener of listeners) {
        try {
          await listener(data);
        } catch (error) {
          console.error(`Error in SSE listener for ${data.type}:`, error);
        }
      }

      // Also dispatch to 'all' listeners
      const allListeners = eventListeners['all'] || [];
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
  }, [eventListeners]);

  const handleSSEError = useCallback((error) => {
    console.error("Global SSE: Connection error:", error);
    setIsConnected(false);
  }, []);

  // Connect SSE when user is available
  const connectSSE = useCallback((userId) => {
    // Prevent duplicate connections for the same user
    if (currentUserId === userId && isConnected) {
      console.log(`Global SSE: Already connected for user ${userId}`);
      return;
    }

    console.log(`Global SSE: Connecting for user ${userId}`);
    SSEService.connect(userId, handleSSEMessage, handleSSEError);
    setCurrentUserId(userId);
    setIsConnected(true);
  }, [handleSSEMessage, handleSSEError, currentUserId, isConnected]);

  // Disconnect SSE
  const disconnectSSE = useCallback(() => {
    console.log("Global SSE: Disconnecting");
    SSEService.disconnect();
    setCurrentUserId(null);
    setIsConnected(false);
  }, []);

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