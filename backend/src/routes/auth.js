const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username, isActive: true } });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    await user.update({ lastLogin: new Date() });
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/verify
router.post('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

module.exports = router;
