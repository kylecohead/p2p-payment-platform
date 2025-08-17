const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  async getClient(clientId) {
    const response = await fetch(`${API_BASE_URL}/api/client/${clientId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch client data');
    }

    return response.json();
  }

  async topupBalance(clientId, amount) {
    const response = await fetch(`${API_BASE_URL}/api/topup/${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: parseFloat(amount) }),
    });

    if (!response.ok) {
      throw new Error('Topup failed');
    }

    return response.json();
  }

  async sendMoney(clientId, amount, recipientEmail) {
    const response = await fetch(`${API_BASE_URL}/api/send/${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        amount: parseFloat(amount), 
        recipient_email: recipientEmail 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Send money failed');
    }

    return response.json();
  }
}

export default new ApiService();
