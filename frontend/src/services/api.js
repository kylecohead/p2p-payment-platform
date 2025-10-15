const API_BASE_URL = 'http://100.102.145.100:8000'; /*change to your own one for frontend*/

class ApiService {
  // Login method
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    const data = await response.json();
    // persist account info if present
    try {
      const stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({ ...stored, ...data }));
    } catch (e) {
      // ignore storage errors
    }
    return data;
  }

  // Get Client data
  async getClient(clientId) {
    const response = await fetch(`${API_BASE_URL}/api/client/${clientId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch client data');
    }
    const data = await response.json();
    try {
      const stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({ ...stored, ...data }));
    } catch (e) {}
    return data;
  }

  // Signup method
  async signup(name, email, phone, password) {
    const response = await fetch(`${API_BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }
    const data = await response.json();
    try {
      localStorage.setItem('currentUser', JSON.stringify(data));
    } catch (e) {}
    return data;
  }

  // Top-up balance method
  async topupBalance(clientId, amount) {
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid top-up amount');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/topup/${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          currency: "ZAR",
          description: "Account top-up"
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Top-up failed');
      }
      
      const data = await response.json();
      
      // Refresh payment history for client so UI shows the latest entries immediately
      try {
        const hist = await this.getPaymentHistory(clientId, 100);
        const stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
        localStorage.setItem('currentUser', JSON.stringify({ ...stored, ...data, recent_payment_history: hist.payment_history }));
      } catch (e) {
        console.log('Payment history refresh failed after topup:', e);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Send money method
  async sendMoney(clientId, amount, recipientEmail, description = '') {
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount to send');
    }
    if (!recipientEmail) {
      throw new Error('Recipient email is required');
    }

    console.log("ApiService: Sending money request", { clientId, amount, recipientEmail, description });

    const response = await fetch(`${API_BASE_URL}/api/send/${clientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(amount),
        recipient_email: recipientEmail,
        description: description,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Send money failed');
    }
    const data = await response.json();
    console.log("ApiService: Send money response", data);
    
    // Note: We don't immediately refresh payment history here anymore 
    // to avoid race conditions with SSE notifications
    return data;
  }

  // Get payment history
  async getPaymentHistory(clientId, limit = 100) {
    const response = await fetch(`${API_BASE_URL}/api/payment-history/${clientId}?limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch payment history');
    }
    return response.json();
  }

  // Admin API calls
  
  // Get all transactions for admin view
  async getAdminTransactions(statusFilter = null, limit = 200) {
    let url = `${API_BASE_URL}/api/admin/transactions?limit=${limit}`;
    if (statusFilter) {
      url += `&status_filter=${statusFilter}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch admin transactions');
    }
    return response.json();
  }

  // Get all alerts
  async getAlerts(cleared = null) {
    let url = `${API_BASE_URL}/api/admin/alerts`;
    if (cleared !== null) {
      url += `?cleared=${cleared}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch alerts');
    }
    return response.json();
  }

  // Clear an alert
  async clearAlert(alertId) {
    const response = await fetch(`${API_BASE_URL}/api/admin/alerts/${alertId}/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to clear alert');
    }
    return response.json();
  }

  // Block an account (sender or receiver)
  async blockAccount(accountId, blockType, reason = null) {
    // Build URL with query parameters
    let url = `${API_BASE_URL}/api/admin/block-account?account_id=${accountId}&block_type=${blockType}`;
    if (reason) {
      url += `&reason=${encodeURIComponent(reason)}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to block account');
    }
    return response.json();
  }

  // Unblock an account
  async unblockAccount(accountId, blockType) {
    // Build URL with query parameters
    const url = `${API_BASE_URL}/api/admin/unblock-account?account_id=${accountId}&block_type=${blockType}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to unblock account');
    }
    return response.json();
  }

  // Export flagged payments CSV
  async exportFlaggedPayments(userId, includeCleared = false) {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/export-flagged-payments?user_id=${userId}&include_cleared=${includeCleared}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'text/csv' },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to export CSV');
    }
    
    // Return the blob for download
    return response.blob();
  }

  // Export active blocks CSV
  async exportActiveBlocks(userId) {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/export-active-blocks?user_id=${userId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'text/csv' },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to export CSV');
    }
    
    // Return the blob for download
    return response.blob();
  }
}

export default new ApiService();
