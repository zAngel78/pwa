# Configuración de API - Frontend

## 📁 Estructura de Configuración

La configuración de la API está completamente centralizada para facilitar cambios en el futuro:

```
src/
├── config/
│   └── api.js          # ✅ Configuración centralizada de URLs y endpoints
├── lib/
│   └── axios.js        # ✅ Configuración de axios con interceptors
└── services/
    └── api.js          # ✅ Servicios que usan la configuración centralizada
```

## 🔧 Cómo cambiar la URL base de la API

### Opción 1: Variables de Entorno (RECOMENDADO)

1. Crea un archivo `.env` en la raíz del proyecto frontend:
```bash
# .env
VITE_API_URL=http://tu-nueva-url.com/api
```

2. Para diferentes entornos, usa archivos específicos:
```bash
# .env.development
VITE_API_URL=http://localhost:5000/api

# .env.production  
VITE_API_URL=https://api.tu-dominio.com/api

# .env.staging
VITE_API_URL=https://staging-api.tu-dominio.com/api
```

### Opción 2: Modificar el archivo de configuración

Si necesitas cambiar permanentemente la URL, edita:
```javascript
// src/config/api.js
export const API_CONFIG = {
  baseURL: 'https://tu-nueva-url.com/api', // ⬅️ Cambia aquí
  timeout: 10000,
  retries: 3,
};
```

## 📋 Endpoints disponibles

Todos los endpoints están centralizados en `src/config/api.js`:

- **Authentication**: `/auth/*`
- **Customers**: `/customers/*`  
- **Products**: `/products/*`
- **Orders**: `/orders/*`
- **Dashboard**: `/dashboard/*`
- **Health**: `/health`

## 🔄 Cómo agregar nuevos endpoints

1. Agrega el endpoint en `src/config/api.js`:
```javascript
export const API_ENDPOINTS = {
  // ... endpoints existentes
  NUEVO_MODULO: {
    BASE: '/nuevo-modulo',
    BY_ID: (id) => `/nuevo-modulo/${id}`,
  },
};
```

2. Crea el servicio en `src/services/api.js`:
```javascript
export const nuevoModuloAPI = {
  getAll: (params) => api.get(API_ENDPOINTS.NUEVO_MODULO.BASE, { params }),
  getById: (id) => api.get(API_ENDPOINTS.NUEVO_MODULO.BY_ID(id)),
  // ... más métodos
};
```

## 🛡️ Manejo de errores

Los errores están centralizados y se manejan automáticamente:

- **401 Unauthorized**: Redirige al login automáticamente
- **404 Not Found**: Mensaje amigable  
- **400 Bad Request**: Error de validación
- **500 Server Error**: Error del servidor
- **Network Error**: Sin conexión

## 🎯 Beneficios de esta estructura

✅ **Un solo lugar para cambiar URLs**: Solo modifica `src/config/api.js`  
✅ **Variables de entorno**: Fácil configuración por ambiente  
✅ **Manejo centralizado de errores**: Consistencia en toda la app  
✅ **TypeScript ready**: Fácil de tipar en el futuro  
✅ **Mantenible**: Código organizado y fácil de entender

## 🚀 Para despliegue en producción

1. Configura la variable de entorno en tu servicio de hosting:
```bash
VITE_API_URL=https://tu-api-produccion.com/api
```

2. O modifica directamente `src/config/api.js` antes del build:
```javascript
export const API_CONFIG = {
  baseURL: 'https://tu-api-produccion.com/api',
  // ...
};
```

¡Listo! Con esta estructura nunca más tendrás URLs hardcodeadas dispersas por el código. 🎉