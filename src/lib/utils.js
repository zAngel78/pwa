import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistance, parseISO } from 'date-fns';
// import { es } from 'date-fns/locale';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Formato de moneda chilena
export const formatCLP = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Formato de fechas
export const formatDate = (date) => {
  if (!date) return '—';
  return format(parseISO(date), 'dd/MM/yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(parseISO(date), 'dd/MM/yyyy HH:mm');
};

export const formatRelativeTime = (date) => {
  if (!date) return '—';

  const now = new Date();
  const past = parseISO(date);
  const diffInMinutes = Math.floor((now - past) / (1000 * 60));

  if (diffInMinutes < 1) return 'hace unos segundos';
  if (diffInMinutes < 60) return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;

  const diffInYears = Math.floor(diffInDays / 365);
  return `hace ${diffInYears} año${diffInYears > 1 ? 's' : ''}`;
};

// Validación de RUT chileno
export const validateRUT = (rut) => {
  if (!rut) return false;
  
  // Limpiar RUT
  const cleanRUT = rut.replace(/[^0-9kK]/g, '');
  if (cleanRUT.length < 2) return false;
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1).toUpperCase();
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedDV = 11 - remainder;
  let expectedDV;
  
  if (calculatedDV === 11) expectedDV = '0';
  else if (calculatedDV === 10) expectedDV = 'K';
  else expectedDV = calculatedDV.toString();
  
  return dv === expectedDV;
};

// Formatear RUT
export const formatRUT = (rut) => {
  if (!rut) return '';
  
  // Limpiar RUT
  const cleanRUT = rut.replace(/[^0-9kK]/g, '');
  if (cleanRUT.length < 2) return rut;
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  
  // Formatear con puntos y guión
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
};

// Estados y sus colores
export const getStatusColor = (status) => {
  const colors = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    compra: 'bg-blue-100 text-blue-800',
    facturado: 'bg-emerald-100 text-emerald-800',
    nulo: 'bg-gray-100 text-gray-800',
    entregado: 'bg-green-100 text-green-800',
    vencido: 'bg-red-100 text-red-800',
  };
  return colors[status] || colors.pendiente;
};

// Verificar si una orden está vencida
export const isOrderOverdue = (order) => {
  if (order.status !== 'facturado' || order.delivered_at) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(order.delivery_due);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
};

// Obtener badge de estado de entrega
export const getDeliveryStatus = (order) => {
  if (order.delivered_at) return 'entregado';
  if (isOrderOverdue(order)) return 'vencido';
  if (order.status === 'facturado') return 'pendiente';
  return null;
};

// Generar ID único
export const generateId = () => {
  return Math.random().toString(36).substring(2, 10);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};