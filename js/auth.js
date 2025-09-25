// js/auth.js - Sistema de autenticación demo para RecycleWebsite









// frontend/js/auth.js - VERSION ACTUALIZADA
const rwAuth = {
  async login(username, password) {
    try {
      const result = await window.recycleAPI.login(username, password);
      return result.success;
    } catch (error) {
      console.error('Error de login:', error);
      return false;
    }
  },

  logout() {
    window.recycleAPI.logout();
  },

  isAuthenticated() {
    const token = localStorage.getItem('rw_auth_token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  },

  getCurrentUser() {
    const user = localStorage.getItem('rw_user');
    return user ? JSON.parse(user) : null;
  },

  redirectToLogin() {
    window.location.href = 'login.html';
  },

  redirectToAdmin() {
    window.location.href = 'admin.html';
  }
};

window.rwAuth = rwAuth;
