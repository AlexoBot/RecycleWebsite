// frontend/js/api.js
class RecycleAPI {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = localStorage.getItem('rw_auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Autenticación
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('rw_auth_token', this.token);
      localStorage.setItem('rw_user', JSON.stringify(data.data.user));
    }
    return data;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('rw_auth_token');
    localStorage.removeItem('rw_user');
  }

  // Tipos de residuos
  async getWasteTypes() {
    return this.request('/waste-types');
  }

  async createWasteType(wasteTypeData) {
    return this.request('/waste-types', {
      method: 'POST',
      body: JSON.stringify(wasteTypeData)
    });
  }

  async updateWasteType(id, wasteTypeData) {
    return this.request(`/waste-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(wasteTypeData)
    });
  }

  async deleteWasteType(id) {
    return this.request(`/waste-types/${id}`, {
      method: 'DELETE'
    });
  }

  // Comentarios
  async getComments() {
    return this.request('/comments');
  }

  async createComment(commentData) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
  }

  async updateComment(id, commentData) {
    return this.request(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(commentData)
    });
  }

  async deleteComment(id) {
    return this.request(`/comments/${id}`, {
      method: 'DELETE'
    });
  }
}

// Instancia global
window.recycleAPI = new RecycleAPI();
