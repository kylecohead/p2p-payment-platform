/**
 * Server-Sent Events (SSE) service for real-time updates
 */

const API_BASE_URL = "http://localhost:8000";

class SSEService {
  constructor() {
    this.eventSources = new Map();
    this.listeners = new Map();
  }

  /**
   * Connect to SSE stream for a specific client
   * @param {number} clientId - The client ID to listen for
   * @param {function} onMessage - Callback for messages
   * @param {function} onError - Callback for errors
   */
  connect(clientId, onMessage, onError = null) {
    // Close existing connection if any
    this.disconnect(clientId);

    const eventSource = new EventSource(`${API_BASE_URL}/api/events/${clientId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error("Error parsing SSE message:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      if (onError) {
        onError(error);
      }
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (this.eventSources.has(clientId)) {
          eventSource.close();
          this.connect(clientId, onMessage, onError);
        }
      }, 5000);
    };

    this.eventSources.set(clientId, eventSource);
    
    return eventSource;
  }

  /**
   * Disconnect SSE stream for a specific client
   * @param {number} clientId - The client ID to disconnect
   */
  disconnect(clientId) {
    const eventSource = this.eventSources.get(clientId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(clientId);
    }
  }

  /**
   * Disconnect all SSE streams
   */
  disconnectAll() {
    this.eventSources.forEach((eventSource) => {
      eventSource.close();
    });
    this.eventSources.clear();
  }

  /**
   * Check if client is connected
   * @param {number} clientId - The client ID to check
   */
  isConnected(clientId) {
    const eventSource = this.eventSources.get(clientId);
    return eventSource && eventSource.readyState === EventSource.OPEN;
  }
}

// Export singleton instance
export default new SSEService();