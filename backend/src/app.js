const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const sequelize = require('./config/database');
const { User, WasteType, Comment } = require('./models');

const app = express();

// Seguridad básica
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones desde esta IP'
});
app.use('/api/', limiter);

// Rate limiting especial para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de login'
});
app.use('/api/auth/login', loginLimiter);

// Rutas
app.use('/api/auth', require('./routes/auth'));
// ...otras rutas (wasteTypes, comments) se agregarán en Fase 3

// Test DB connection
sequelize.authenticate()
  .then(() => console.log('Conexión a la base de datos exitosa'))
  .catch(err => console.error('Error de conexión a la base de datos:', err));

// Sincronizar modelos (solo para desarrollo, no usar force: true en producción)
sequelize.sync({ alter: true })
  .then(() => console.log('Modelos sincronizados'))
  .catch(err => console.error('Error al sincronizar modelos:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
