import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.js';

// Auth API
export const authAPI = {
  login: (credentials) => api.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData) => api.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  getMe: () => api.get(API_ENDPOINTS.AUTH.ME),
  updateProfile: (profileData) => api.put(API_ENDPOINTS.AUTH.ME, profileData),
  changePassword: (passwords) => api.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwords),
  logout: () => api.post(API_ENDPOINTS.AUTH.LOGOUT),
};

// Users API (Admin only)
export const usersAPI = {
  getAll: (params) => api.get(API_ENDPOINTS.USERS.BASE, { params }),
  getById: (id) => api.get(API_ENDPOINTS.USERS.BY_ID(id)),
  create: (userData) => api.post(API_ENDPOINTS.USERS.BASE, userData),
  update: (id, userData) => api.put(API_ENDPOINTS.USERS.BY_ID(id), userData),
  delete: (id) => api.delete(API_ENDPOINTS.USERS.BY_ID(id)),
  resetPassword: (id, newPassword) => api.put(API_ENDPOINTS.USERS.RESET_PASSWORD(id), { newPassword }),
  generatePassword: () => api.post(API_ENDPOINTS.USERS.GENERATE_PASSWORD),
  getStats: () => api.get(API_ENDPOINTS.USERS.STATS),
};

// Customers API
export const customersAPI = {
  getAll: (params) => api.get(API_ENDPOINTS.CUSTOMERS.BASE, { params }),
  getById: (id) => api.get(API_ENDPOINTS.CUSTOMERS.BY_ID(id)),
  create: (data) => api.post(API_ENDPOINTS.CUSTOMERS.BASE, data),
  update: (id, data) => api.put(API_ENDPOINTS.CUSTOMERS.BY_ID(id), data),
  delete: (id) => api.delete(API_ENDPOINTS.CUSTOMERS.BY_ID(id)),
  bulkCreate: (customers) => api.post(API_ENDPOINTS.CUSTOMERS.BULK_CREATE, { customers }),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get(API_ENDPOINTS.PRODUCTS.BASE, { params }),
  getById: (id) => api.get(API_ENDPOINTS.PRODUCTS.BY_ID(id)),
  create: (data) => api.post(API_ENDPOINTS.PRODUCTS.BASE, data),
  update: (id, data) => api.put(API_ENDPOINTS.PRODUCTS.BY_ID(id), data),
  delete: (id) => api.delete(API_ENDPOINTS.PRODUCTS.BY_ID(id)),
  updateStock: (id, stockData) => api.patch(API_ENDPOINTS.PRODUCTS.UPDATE_STOCK(id), stockData),
  getCategories: () => api.get(API_ENDPOINTS.PRODUCTS.CATEGORIES),
  bulkCreate: (products) => api.post(API_ENDPOINTS.PRODUCTS.BULK_CREATE, { products }),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get(API_ENDPOINTS.ORDERS.BASE, { params }),
  getById: (id) => api.get(API_ENDPOINTS.ORDERS.BY_ID(id)),
  create: (data) => api.post(API_ENDPOINTS.ORDERS.BASE, data),
  update: (id, data) => api.patch(API_ENDPOINTS.ORDERS.BY_ID(id), data),
  updateStatus: (id, status) => api.patch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status }),
  markDelivered: (id) => api.patch(API_ENDPOINTS.ORDERS.MARK_DELIVERED(id)),
  markNullified: (id) => api.patch(API_ENDPOINTS.ORDERS.MARK_NULLIFIED(id)),
  delete: (id) => api.delete(API_ENDPOINTS.ORDERS.BY_ID(id)),
};

// Dashboard API
export const dashboardAPI = {
  getMetrics: () => api.get(API_ENDPOINTS.DASHBOARD.METRICS),
  getRecentOrders: (params) => api.get(API_ENDPOINTS.DASHBOARD.RECENT_ORDERS, { params }),
  getLowStockProducts: () => api.get(API_ENDPOINTS.DASHBOARD.LOW_STOCK),
  getStats: (params) => api.get(API_ENDPOINTS.DASHBOARD.STATS, { params }),
  getTopProducts: (params) => api.get(API_ENDPOINTS.DASHBOARD.TOP_PRODUCTS, { params }),
  getTopCustomers: (params) => api.get(API_ENDPOINTS.DASHBOARD.TOP_CUSTOMERS, { params }),
};

// Notifications API
export const notificationsAPI = {
  testEmail: (email) => api.post(API_ENDPOINTS.NOTIFICATIONS.TEST, { email }),
  getConfig: () => api.get(API_ENDPOINTS.NOTIFICATIONS.CONFIG),
  updateConfig: (config) => api.put(API_ENDPOINTS.NOTIFICATIONS.UPDATE_CONFIG, config),
  addExtraEmail: (email, name) => api.post(API_ENDPOINTS.NOTIFICATIONS.ADD_EXTRA_EMAIL, { email, name }),
  deleteExtraEmail: (email) => api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE_EXTRA_EMAIL(email)),
  syncUsers: () => api.post(API_ENDPOINTS.NOTIFICATIONS.SYNC_USERS),
};

// Health check
export const healthAPI = {
  check: () => api.get(API_ENDPOINTS.HEALTH.CHECK),
};