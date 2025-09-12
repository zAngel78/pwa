// Configuración centralizada de la API

// URL base de la API - Se puede cambiar aquí para todos los endpoints
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'https://gitinore.onrender.com/api',
  timeout: 10000,
  retries: 3,
};

// Endpoints centralizados - Si cambias la estructura del backend, solo cambias aquí
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/password',
    LOGOUT: '/auth/logout',
  },

  // Customers
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id) => `/customers/${id}`,
    BULK_CREATE: '/customers/bulk',
  },

  // Products
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id) => `/products/${id}`,
    UPDATE_STOCK: (id) => `/products/${id}/stock`,
    CATEGORIES: '/products/meta/categories',
    BULK_CREATE: '/products/bulk',
  },

  // Orders
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id) => `/orders/${id}`,
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    MARK_DELIVERED: (id) => `/orders/${id}/deliver`,
    MARK_NULLIFIED: (id) => `/orders/${id}/nullify`,
  },

  // Dashboard
  DASHBOARD: {
    METRICS: '/dashboard/metrics',
    RECENT_ORDERS: '/dashboard/recent-orders',
    LOW_STOCK: '/dashboard/low-stock',
    STATS: '/dashboard/stats',
    TOP_PRODUCTS: '/dashboard/top-products',
    TOP_CUSTOMERS: '/dashboard/top-customers',
  },

  // Health
  HEALTH: {
    CHECK: '/health',
  },
};

// Headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Configuración de errores
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  TIMEOUT_ERROR: 'La solicitud tardó demasiado. Inténtalo de nuevo.',
  SERVER_ERROR: 'Error del servidor. Inténtalo más tarde.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  VALIDATION_ERROR: 'Los datos enviados no son válidos.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
};

// Códigos de estado HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};