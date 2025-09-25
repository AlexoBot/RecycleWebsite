// js/auth.js - Sistema de autenticación demo para RecycleWebsite

const DEMO_USERS = [
  { username: 'admin', password: 'recicla2025', role: 'admin' },
  { username: 'moderador', password: 'verde123', role: 'moderator' }
];

function login(username, password) {
  const user = DEMO_USERS.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem('rw_auth_user', JSON.stringify({ username: user.username, role: user.role }));
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem('rw_auth_user');
}

function isAuthenticated() {
  return !!localStorage.getItem('rw_auth_user');
}

function getCurrentUser() {
  const data = localStorage.getItem('rw_auth_user');
  return data ? JSON.parse(data) : null;
}

function redirectToLogin() {
  window.location.href = 'login.html';
}

function redirectToAdmin() {
  window.location.href = 'admin.html';
}

// Expose for inline scripts
window.rwAuth = {
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  redirectToLogin,
  redirectToAdmin
};

// Auto-logout if session is invalid (optional, for admin.html)
