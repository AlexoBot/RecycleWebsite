# Plan de Implementación PostgreSQL - RecycleWebsite

## Análisis de la Situación Actual

### Sistema Actual
- **Frontend**: HTML, CSS, JavaScript vanilla con React (CDN)
- **Almacenamiento**: LocalStorage (temporal, solo en navegador)
- **Autenticación**: Array hardcodeado en `auth.js`
- **Datos gestionados**: 
  - Tipos de residuos
  - Comentarios de usuarios
  - Usuarios de administración

### Limitaciones Identificadas
1. **Persistencia**: Los datos se pierden al limpiar cache/navegador
2. **Multiusuario**: No hay sincronización entre diferentes dispositivos
3. **Seguridad**: Credenciales expuestas en frontend
4. **Escalabilidad**: No permite crecimiento de datos
5. **Backup**: No hay respaldo de información

## Objetivos del Proyecto

### Objetivo Principal
Migrar el almacenamiento de LocalStorage a PostgreSQL para lograr persistencia de datos, seguridad y multiusuario.

### Objetivos Específicos
1. Implementar backend con Node.js y Express
2. Conectar PostgreSQL como base de datos principal
3. Crear API REST para CRUD operations
4. Implementar autenticación JWT
5. Mantener la interfaz actual (frontend)
6. Agregar validaciones y seguridad

## Arquitectura Propuesta

### Stack Tecnológico
- **Frontend**: HTML, CSS, JavaScript (mantener actual)
- **Backend**: Node.js + Express.js
- **Base de datos**: PostgreSQL
- **Autenticación**: JSON Web Tokens (JWT)
- **ORM**: Sequelize o Prisma
- **Validación**: Joi o express-validator

### Estructura de Proyecto Final
```
RecycleWebsite/
├── frontend/                 # Cliente (archivos actuales)
│   ├── index.html
│   ├── admin.html
│   ├── login.html
│   ├── styles.css
│   ├── js/
│   │   ├── auth.js          # Modificado para API calls
│   │   ├── admin.js         # Modificado para API calls
│   │   └── api.js           # Nuevo - cliente API
│   └── Photos/
├── backend/                  # Servidor API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── WasteType.js
│   │   │   └── Comment.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── wasteTypes.js
│   │   │   └── comments.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── wasteTypeController.js
│   │   │   └── commentController.js
│   │   └── app.js
│   ├── package.json
│   └── .env
├── database/
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_waste_types.sql
│   │   └── 003_create_comments.sql
│   ├── seeds/
│   │   ├── users.sql
│   │   └── waste_types.sql
│   └── schema.sql
├── docker-compose.yml        # Para desarrollo local
├── README.md
└── package.json              # Scripts globales
```

## Diseño de Base de Datos

### Esquema PostgreSQL

#### Tabla: users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### Tabla: waste_types
```sql
CREATE TABLE waste_types (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    imagen VARCHAR(255),
    instrucciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: comments
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    mensaje TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'leído', 'respondido')),
    ip_address INET,
    user_agent TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_by INTEGER REFERENCES users(id),
    response_date TIMESTAMP
);
```

#### Índices Recomendados
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_waste_types_activo ON waste_types(activo);
CREATE INDEX idx_comments_estado ON comments(estado);
CREATE INDEX idx_comments_fecha ON comments(fecha DESC);
```

## Plan de Implementación

### FASE 1: Configuración del Entorno (Día 1-2)

#### 1.1 Configuración de PostgreSQL
```bash
# Instalación usando Docker (recomendado para desarrollo)
docker run --name recycle-postgres \
  -e POSTGRES_DB=recyclewebsite \
  -e POSTGRES_USER=recycleuser \
  -e POSTGRES_PASSWORD=recyclepass \
  -p 5432:5432 \
  -d postgres:15
```

#### 1.2 Inicialización del Backend
```bash
# Crear estructura del backend
mkdir backend
cd backend
npm init -y

# Instalar dependencias
npm install express sequelize pg pg-hstore bcryptjs jsonwebtoken
npm install cors helmet morgan dotenv joi
npm install -D nodemon concurrently
```

#### 1.3 Configuración de Variables de Entorno
```env
# backend/.env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_NAME=recyclewebsite
DB_USER=recycleuser
DB_PASSWORD=recyclepass
DB_PORT=5432
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
JWT_EXPIRE=24h
CORS_ORIGIN=http://localhost:3000
```

### FASE 2: Desarrollo del Backend API (Día 3-5)

#### 2.1 Configuración de Base de Datos (Sequelize)
```javascript
// backend/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
```

#### 2.2 Modelos de Datos
```javascript
// backend/src/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true,
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  role: {
    type: DataTypes.ENUM('admin', 'moderator'),
    defaultValue: 'admin'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.passwordHash = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        user.passwordHash = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = User;
```

#### 2.3 Rutas de API
```javascript
// backend/src/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validateLogin } = require('../middleware/validation');
const router = express.Router();

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ 
      where: { username, isActive: true }
    });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
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
```

### FASE 3: Migración del Frontend (Día 6-7)

#### 3.1 Cliente API
```javascript
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
```

#### 3.2 Migración de auth.js
```javascript
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
```

#### 3.3 Migración de admin.js
```javascript
// frontend/js/admin.js - VERSION ACTUALIZADA
const rwAdmin = {
  async loadWasteTypes() {
    try {
      const response = await window.recycleAPI.getWasteTypes();
      const types = response.data;
      const list = document.getElementById('wasteTypesList');
      
      list.innerHTML = types.length === 0 ? 
        '<p>No hay tipos registrados.</p>' : 
        types.map(t => `
          <div class="waste-type-card">
            <strong>${t.nombre}</strong> 
            <span class="waste-status ${t.activo ? 'active' : 'inactive'}">
              ${t.activo ? 'Activo' : 'Inactivo'}
            </span><br>
            <small>${t.descripcion}</small><br>
            <img src="${t.imagen || ''}" alt="img" 
                 style="max-width:80px;max-height:50px;vertical-align:middle;">
            <div class="waste-actions">
              <button onclick="rwAdmin.toggleWasteTypeStatus(${t.id})">
                ${t.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button onclick="rwAdmin.editWasteTypePrompt(${t.id})">Editar</button>
              <button onclick="rwAdmin.deleteWasteType(${t.id})">Eliminar</button>
            </div>
            <div class="waste-instr"><em>${t.instrucciones || ''}</em></div>
          </div>
        `).join('');
    } catch (error) {
      console.error('Error cargando tipos:', error);
      document.getElementById('wasteTypesList').innerHTML = 
        '<p style="color: red;">Error cargando datos</p>';
    }
  },

  async addWasteType(data) {
    try {
      await window.recycleAPI.createWasteType(data);
      await this.loadWasteTypes();
      showToast('Tipo de residuo agregado exitosamente');
    } catch (error) {
      console.error('Error agregando tipo:', error);
      showToast('Error al agregar tipo de residuo', '#c0392b');
    }
  },

  async loadComments() {
    try {
      const response = await window.recycleAPI.getComments();
      const comments = response.data;
      const list = document.getElementById('commentsList');
      
      list.innerHTML = comments.length === 0 ? 
        '<p>No hay comentarios.</p>' : 
        comments.map(c => `
          <div class="comment-card ${c.estado}">
            <strong>${c.nombre}</strong> 
            <span class="comment-status">[${c.estado}]</span><br>
            <small>${new Date(c.created_at).toLocaleDateString()}</small><br>
            <div>${c.mensaje}</div>
            <div class="comment-actions">
              <button onclick="rwAdmin.markAsRead(${c.id})">Marcar leído</button>
              <button onclick="rwAdmin.markAsResponded(${c.id})">Marcar respondido</button>
              <button onclick="rwAdmin.deleteComment(${c.id})">Eliminar</button>
            </div>
          </div>
        `).join('');
    } catch (error) {
      console.error('Error cargando comentarios:', error);
      document.getElementById('commentsList').innerHTML = 
        '<p style="color: red;">Error cargando comentarios</p>';
    }
  }

  // ... resto de métodos actualizados
};
```

### FASE 4: Testing y Despliegue (Día 8-9)

#### 4.1 Scripts de Testing
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd backend && npm run dev",
    "client": "cd frontend && python -m http.server 3000",
    "test": "cd backend && npm test",
    "seed": "cd backend && node src/seeders/index.js"
  }
}
```

#### 4.2 Docker Compose para Desarrollo
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: recyclewebsite
      POSTGRES_USER: recycleuser
      POSTGRES_PASSWORD: recyclepass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    environment:
      - NODE_ENV=development
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

## Migración de Datos

### Script de Migración LocalStorage → PostgreSQL
```javascript
// backend/src/utils/migrateLocalStorage.js
const { User, WasteType, Comment } = require('../models');

async function migrateFromLocalStorage(localStorageData) {
  try {
    // Crear usuario administrador por defecto
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@recyclewebsite.com',
      password: 'recicla2025',
      role: 'admin'
    });

    // Migrar tipos de residuos
    if (localStorageData.rw_waste_types) {
      const wasteTypes = JSON.parse(localStorageData.rw_waste_types);
      for (const type of wasteTypes) {
        await WasteType.create({
          nombre: type.nombre,
          descripcion: type.descripcion,
          imagen: type.imagen,
          instrucciones: type.instrucciones,
          activo: type.activo,
          created_by: adminUser.id
        });
      }
    }

    // Migrar comentarios
    if (localStorageData.rw_comments) {
      const comments = JSON.parse(localStorageData.rw_comments);
      for (const comment of comments) {
        await Comment.create({
          nombre: comment.nombre,
          mensaje: comment.mensaje,
          estado: comment.estado,
          ip_address: comment.ip || '127.0.0.1'
        });
      }
    }

    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
}

module.exports = { migrateFromLocalStorage };
```

## Consideraciones de Seguridad

### 1. Autenticación y Autorización
- Tokens JWT con expiración
- Hashing de contraseñas con bcrypt
- Validación de entrada en todas las rutas
- Rate limiting para prevenir ataques

### 2. Base de Datos
- Usar parámetros preparados (Sequelize ORM)
- Validación de esquemas
- Índices para optimizar consultas
- Backups automatizados

### 3. API Security
```javascript
// backend/src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Seguridad básica
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: 'Demasiadas peticiones desde esta IP'
});
app.use('/api/', limiter);

// Rate limiting especial para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por ventana
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de login'
});
app.use('/api/auth/login', loginLimiter);
```

## Cronograma de Implementación

### Semana 1
| Día | Tareas | Tiempo Estimado |
|-----|--------|-----------------|
| 1 | Configuración PostgreSQL + Backend inicial | 4-6 horas |
| 2 | Modelos de datos + Migraciones | 4-6 horas |
| 3 | APIs de autenticación | 3-4 horas |
| 4 | APIs CRUD (waste_types, comments) | 4-6 horas |
| 5 | Testing backend + Correcciones | 2-4 horas |

### Semana 2
| Día | Tareas | Tiempo Estimado |
|-----|--------|-----------------|
| 6 | Migración frontend (auth.js, admin.js) | 4-6 horas |
| 7 | Cliente API + Testing integración | 4-6 horas |
| 8 | Migración de datos + Testing final | 3-4 horas |
| 9 | Documentación + Deploy | 2-3 horas |

**Total estimado**: 30-45 horas de desarrollo

## Próximos Pasos Recomendados

### Inmediatos (Después de PostgreSQL)
1. **Mejoras de UX/UI**
   - Loading states
   - Error handling mejorado
   - Confirmaciones de acciones

2. **Funcionalidades Adicionales**
   - Paginación de comentarios
   - Filtros y búsquedas
   - Estadísticas básicas

### Futuros (Mediano plazo)
1. **Características Avanzadas**
   - Sistema de roles más granular
   - Auditoría de cambios
   - Notificaciones por email

2. **Performance**
   - Cache con Redis
   - CDN para imágenes
   - Optimización de consultas

3. **Deployment**
   - Docker para producción
   - CI/CD pipeline
   - Monitoreo y logging

## Riesgos y Mitigaciones

### Riesgos Identificados
1. **Pérdida de datos durante migración**
   - *Mitigación*: Backup completo antes de migrar, script de rollback

2. **Incompatibilidad de navegadores**
   - *Mitigación*: Testing en múltiples navegadores, polyfills si es necesario

3. **Performance en consultas**
   - *Mitigación*: Índices apropiados, paginación, cache

4. **Tiempo de desarrollo**
   - *Mitigación*: Desarrollo incremental, MVP primero

## Conclusión

Este plan proporciona una ruta clara para migrar RecycleWebsite de LocalStorage a PostgreSQL, manteniendo la funcionalidad actual mientras se agrega persistencia real, seguridad y capacidades multiusuario. 

La implementación por fases permite desarrollo incremental y testing continuo, minimizando riesgos y asegurando una transición suave.

---

*Plan creado el: 25 de septiembre, 2025*  
*Versión: 1.0*  
*Autor: GitHub Copilot*