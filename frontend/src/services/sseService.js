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
  connect(clientId, onMessage, onError) {
    if (this.eventSource) {
      this.disconnect();
    }

    console.log(`SSEService: Connecting to SSE for client ${clientId}`);
    this.eventSource = new EventSource(`http://localhost:8000/api/events/${clientId}`);
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    this.eventSource.onopen = () => {
      console.log('SSEService: SSE connection opened');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };
    
    this.eventSource.onmessage = (event) => {
      console.log('SSEService: Message received:', event.data);
      if (onMessage) {
        onMessage(event);
      }
    };
    
    this.eventSource.onerror = (error) => {
      console.error('SSEService: SSE connection error:', error);
      this.isConnected = false;
      
      if (onError) {
        onError(error);
      }
      
      // Auto-reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`SSEService: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(clientId, onMessage, onError);
        }, delay);
      } else {
        console.error('SSEService: Max reconnection attempts reached');
      }
    };
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