/**
 * Server-Sent Events (SSE) service for real-time updates
 */

const API_BASE_URL = "http://localhost:8000";

class SSEService {
  constructor() {
    this.eventSource = null;
    this.currentClientId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Connect to SSE stream for a specific client
   * @param {number} clientId - The client ID to listen for
   * @param {function} onMessage - Callback for messages
   * @param {function} onError - Callback for errors
   */
  connect(clientId, onMessage, onError) {
    // Prevent multiple connections to the same client
    if (this.eventSource && this.currentClientId === clientId) {
      console.log(`SSEService: Already connected to client ${clientId}`);
      return;
    }

    // Disconnect any existing connection
    if (this.eventSource) {
      this.disconnect();
    }

    console.log(`SSEService: Connecting to SSE for client ${clientId}`);
    this.eventSource = new EventSource(`${API_BASE_URL}/api/events/${clientId}`);
    this.currentClientId = clientId;
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
   * Disconnect SSE stream
   */
  disconnect() {
    if (this.eventSource) {
      console.log('SSEService: Disconnecting SSE connection');
      this.eventSource.close();
      this.eventSource = null;
      this.currentClientId = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Check if currently connected
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      clientId: this.currentClientId,
      readyState: this.eventSource ? this.eventSource.readyState : null
    };
  }
}

// Export singleton instance
export default new SSEService();