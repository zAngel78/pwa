import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Plus
} from 'lucide-react';

import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { formatDateTime, formatRelativeTime, getDeliveryStatus } from '../lib/utils';
import { dashboardAPI, ordersAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, ordersData] = await Promise.all([
        dashboardAPI.getMetrics(),
        dashboardAPI.getRecentOrders({ limit: 10 })
      ]);

      setMetrics(metricsData.data);
      setRecentOrders(ordersData.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      toast.success(`Estado cambiado a ${newStatus}`);
      await loadDashboardData(); // Recargar datos
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      await ordersAPI.markDelivered(orderId);
      toast.success('Pedido marcado como entregado');
      await loadDashboardData(); // Recargar datos
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error('Error al marcar como entregado');
    }
  };

  const handleMarkNullified = async (orderId) => {
    try {
      await ordersAPI.markNullified(orderId);
      toast.success('Pedido anulado');
      await loadDashboardData(); // Recargar datos
    } catch (error) {
      console.error('Error nullifying order:', error);
      const message = error.response?.data?.message || 'Error al anular pedido';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const kpis = metrics ? [
    {
      title: 'Hoy',
      data: metrics.kpis.daily,
      icon: TrendingUp,
      color: 'text-emerald-600'
    },
    {
      title: 'Esta Semana',
      data: metrics.kpis.weekly,
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      title: 'Este Mes',
      data: metrics.kpis.monthly,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2">¡Hola {user?.name}! 👋</h1>
            <p className="text-emerald-100 text-lg">Aquí tienes el resumen de tu negocio</p>
            <div className="flex items-center mt-3">
              <Badge className="bg-white/20 text-white border-white/30">
                {user?.role}
              </Badge>
              <span className="ml-3 text-emerald-200 text-sm">
                {new Date().toLocaleDateString('es-CL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <Link to="/orders/new">
              <Button className="bg-white text-emerald-700 hover:bg-gray-50 shadow-lg font-semibold px-6 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Pedido
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs modernos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const gradients = [
            'from-emerald-500 to-teal-600',
            'from-blue-500 to-indigo-600',
            'from-purple-500 to-pink-600'
          ];
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-5`}></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[index]}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-2xl font-bold ${kpi.color}`}>
                    {kpi.data.orders}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{kpi.title}</h3>
                <p className="text-sm text-gray-500">{kpi.data.orders} pedidos procesados</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Estados modernos */}
      {metrics?.delivery && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{metrics.delivery.overdue || 0}</p>
                <p className="text-sm font-medium text-gray-700">Vencidos</p>
                <p className="text-xs text-red-500">Requieren atención</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{metrics.delivery.byStatus?.pendiente || 0}</p>
                <p className="text-sm font-medium text-gray-700">Pendientes</p>
                <p className="text-xs text-blue-600">Por procesar</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{(metrics.delivery.byStatus?.compra || 0) + (metrics.delivery.byStatus?.facturado || 0) - (metrics.delivery.delivered || 0)}</p>
                <p className="text-sm font-medium text-gray-700">En Proceso</p>
                <p className="text-xs text-amber-600">Por entregar</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{metrics.delivery.delivered || 0}</p>
                <p className="text-sm font-medium text-gray-700">Entregados</p>
                <p className="text-xs text-green-600">Completados</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabla de pedidos moderna */}
      <Card className="border-0 shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pedidos Recientes</h2>
              <p className="text-sm text-gray-500">Últimos 8 pedidos del sistema</p>
            </div>
            <Link to="/orders" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
              Ver todos →
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.slice(0, 8).map((order) => {
              const canManage = user?.role === 'facturador' || user?.role === 'admin';
              
              // Calcular días desde creación
              const createdDate = new Date(order.createdAt);
              const today = new Date();
              const daysDiff = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
              const canNullify = daysDiff >= 7 && (order.status === 'pendiente' || order.status === 'compra');
              
              return (
                <div key={order._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant={order.status} size="sm" className="font-medium">
                          {order.status.toUpperCase()}
                        </Badge>
                        <span className="font-semibold text-gray-900 text-lg">{order.customer?.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatRelativeTime(order.createdAt)}
                        </span>
                        <span className="font-medium">#{order.order_number}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-600">
                          {order.items?.length || 0} productos
                        </p>
                        <p className="text-xs text-gray-500">En el pedido</p>
                      </div>
                    {canManage && (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="pendiente">pendiente</option>
                        <option value="compra">compra</option>
                        <option value="facturado">facturado</option>
                        <option value="nulo">nulo</option>
                      </select>
                    )}
                    {canManage && order.status === 'facturado' && !order.delivered_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkDelivered(order._id)}
                      >
                        Entregar
                      </Button>
                    )}
                      {canManage && canNullify && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkNullified(order._id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Nulo ({daysDiff}d)
                        </Button>
                      )}
                      {canManage && (order.status === 'pendiente' || order.status === 'compra') && !canNullify && (
                        <span className="text-xs text-gray-400 px-2">
                          Nulo en {7 - daysDiff}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
            <div className="text-center py-16">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay pedidos aún</h3>
              <p className="text-gray-500 mb-6">¡Empieza creando tu primer pedido para ver las métricas aquí!</p>
              <Link to="/orders/new">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-6 py-3">
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Mi Primer Pedido
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Botón flotante para móvil */}
      <div className="sm:hidden fixed bottom-6 right-6 z-50">
        <Link to="/orders/new">
          <Button className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;