# RecycleWebsite - Guía de Testing y Despliegue

## Testing y Desarrollo Local

### 1. Levantar el entorno de desarrollo

Puedes usar Docker Compose para levantar la base de datos y el backend:

```bash
docker-compose up --build
```

Esto iniciará PostgreSQL y el backend en modo desarrollo.

### 2. Levantar el frontend

En otra terminal, ejecuta:

```bash
npm run client
```

Esto servirá el frontend en http://localhost:3000

### 3. Testing manual

- Accede a http://localhost:3000/login.html
- Prueba el login con el usuario administrador (deberás crearlo en la base de datos o usar el script de migración).
- Prueba las funciones de administración y comentarios desde el panel de admin.

### 4. Testing backend

Puedes agregar tests en `backend/tests/` y ejecutarlos con:

```bash
npm run test
```

### 5. Seeders y migraciones

Para poblar la base de datos con datos de ejemplo:

```bash
npm run seed
```

## Despliegue

- Para producción, ajusta variables en `.env` y usa imágenes optimizadas.
- Revisa la seguridad de JWT y CORS antes de exponer la API.

---

*Guía generada por GitHub Copilot*