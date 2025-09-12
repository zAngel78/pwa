import axios from 'axios';
import { API_CONFIG, DEFAULT_HEADERS, ERROR_MESSAGES, HTTP_STATUS } from '../config/api.js';

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: DEFAULT_HEADERS,
});

// Request interceptor para añadir el token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor para manejar errores globales
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Manejo de errores centralizado
    const status = error.response?.status;
    let errorMessage = error.response?.data?.message || ERROR_MESSAGES.SERVER_ERROR;

    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
        break;
      case HTTP_STATUS.NOT_FOUND:
        errorMessage = ERROR_MESSAGES.NOT_FOUND;
        break;
      case HTTP_STATUS.BAD_REQUEST:
        errorMessage = ERROR_MESSAGES.VALIDATION_ERROR;
        break;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        errorMessage = ERROR_MESSAGES.SERVER_ERROR;
        break;
      default:
        if (!error.response) {
          errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
        }
    }

    // Preservar la estructura original pero con mensajes mejorados
    const enhancedError = {
      ...error.response?.data,
      message: errorMessage,
      status: status,
      originalMessage: error.response?.data?.message
    };

    return Promise.reject(enhancedError);
  }
);

export default api;