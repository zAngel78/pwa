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
import { formatCLP, formatDateTime, formatRelativeTime, getDeliveryStatus } from '../lib/utils';
import { dashboardAPI, ordersAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, ordersData, stockData] = await Promise.all([
        dashboardAPI.getMetrics(),
        dashboardAPI.getRecentOrders({ limit: 10 }),
        dashboardAPI.getLowStockProducts()
      ]);

      setMetrics(metricsData.data);
      setRecentOrders(ordersData.data);
      setLowStockProducts(stockData.data);
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
    <div className="space-y-6">
      {/* Header simple */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Resumen del negocio</p>
        </div>
        <Link to="/orders/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Pedido
          </Button>
        </Link>
      </div>

      {/* KPIs simplificados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">{kpi.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {kpi.data.orders}
              </p>
              <p className="text-sm text-gray-500">pedidos</p>
              <p className="text-lg font-semibold text-emerald-600 mt-2">
                {formatCLP(kpi.data.total)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Estados rápidos */}
      {metrics?.delivery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{metrics.delivery.overdue}</p>
            <p className="text-sm text-gray-600">Vencidos</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{metrics.delivery.pending}</p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </Card>
          <Card className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{metrics.delivery.delivered}</p>
            <p className="text-sm text-gray-600">Entregados</p>
          </Card>
        </div>
      )}

      {/* Tabla de pedidos simplificada */}
      <Card title="Pedidos Recientes">
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
                <div key={order._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Badge variant={order.status} size="sm">
                        {order.status}
                      </Badge>
                      <span className="font-medium">{order.customer?.name}</span>
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-emerald-600">
                      {formatCLP(order.total)}
                    </span>
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
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay pedidos aún</p>
            <Link to="/orders/new">
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Pedido
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;