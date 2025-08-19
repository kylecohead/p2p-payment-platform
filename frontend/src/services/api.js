const API_BASE_URL = 'http://100.102.145.100:8000';

class ApiService {
  // Login method
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  // Get Client data
  async getClient(clientId) {
    const response = await fetch(`${API_BASE_URL}/api/client/${clientId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch client data');
    }

    return response.json();
  }

  // Signup method
  async signup(name, email, phone, password) {
    const response = await fetch(`${API_BASE_URL}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, phone, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    return response.json();
  }

  // Top-up balance method
  async topupBalance(clientId, amount) {
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid top-up amount');
    }

    const response = await fetch(`${API_BASE_URL}/api/topup/${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: parseFloat(amount) }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Top-up failed');
    }

    return response.json();
  }

  // Send money method
  async sendMoney(clientId, amount, recipientEmail) {
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount to send');
    }

    if (!recipientEmail) {
      throw new Error('Recipient email is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/send/${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        recipient_email: recipientEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Send money failed');
    }

    return response.json();
  }

  // Receive money method
  async receiveMoney(clientId, amount) {
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount to receive');
    }

    const response = await fetch(`${API_BASE_URL}/api/receive/${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: parseFloat(amount) }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Receive money failed');
    }

    return response.json();
  }
}

export default new ApiService();
