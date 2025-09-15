import { useState, useEffect } from 'react';
import { Eye, Edit2, Trash2, Printer, Package } from 'lucide-react';
import toast from 'react-hot-toast';

import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import { formatCLP, formatDateTime, formatDate, getDeliveryStatus } from '../lib/utils';
import { ordersAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const Orders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      setOrders(response.data || []);
    } catch (error) {
      toast.error('Error cargando pedidos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Función para generar PDF de un solo pedido
  const printSingleOrder = (order) => {
    generatePDF([order], `Pedido_${order.order_number}`);
  };

  // Función para generar PDF de múltiples pedidos
  const printOrders = (ordersList) => {
    if (ordersList.length === 0) {
      toast.error('No hay pedidos para imprimir');
      return;
    }

    const status = ordersList[0]?.status || 'pedidos';
    const filename = `Reporte_${status}_${new Date().toISOString().split('T')[0]}`;
    generatePDF(ordersList, filename);
  };

  // Función para generar PDF
  const generatePDF = (ordersList, filename) => {
    // Crear ventana temporal para generar PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateOrderPrintHTML(ordersList));
    printWindow.document.close();

    // Usar la funcionalidad de imprimir del navegador pero configurada para PDF
    printWindow.onload = function() {
      printWindow.print();
    };

    toast.success(`Generando reporte PDF: ${filename}`);
  };

  // Generar HTML para impresión
  const generateOrderPrintHTML = (ordersList) => {
    const currentDate = new Date().toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte de Pedidos</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #059669;
              padding-bottom: 10px;
            }
            .header h1 {
              color: #059669;
              font-size: 24px;
              margin-bottom: 5px;
            }
            .header p {
              color: #666;
              font-size: 14px;
            }
            .order {
              margin-bottom: 30px;
              border: 1px solid #ddd;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .order-header {
              background: #f8f9fa;
              padding: 15px;
              border-bottom: 1px solid #ddd;
              display: flex;
              justify-content: space-between;
            }
            .order-header h3 {
              color: #059669;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .order-info {
              padding: 15px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            .info-item {
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #374151;
              display: inline-block;
              min-width: 80px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pendiente { background: #fef3c7; color: #92400e; }
            .status-compra { background: #dbeafe; color: #1e40af; }
            .status-facturado { background: #d1fae5; color: #065f46; }
            .status-nulo { background: #f3f4f6; color: #374151; }
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .products-table th,
            .products-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .products-table th {
              background: #f8f9fa;
              font-weight: bold;
              color: #374151;
            }
            .total-row {
              background: #f0f9f4;
              font-weight: bold;
            }
            .notes {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 4px;
              padding: 10px;
              margin-top: 15px;
            }
            .notes-label {
              font-weight: bold;
              color: #92400e;
              margin-bottom: 5px;
            }
            @media print {
              .order {
                page-break-inside: avoid;
                margin-bottom: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📦 Reporte de Pedidos</h1>
            <p>Sistema de Pedidos y Facturación</p>
            <p>Generado el: ${currentDate}</p>
            <p>Total de pedidos: ${ordersList.length}</p>
          </div>

          ${ordersList.map(order => `
            <div class="order">
              <div class="order-header">
                <div>
                  <h3>Pedido #${order.order_number}</h3>
                  <span class="status-badge status-${order.status}">${order.status}</span>
                </div>
                <div>
                  <strong style="color: #059669; font-size: 16px;">${formatCLP(order.total)}</strong>
                </div>
              </div>

              <div class="order-info">
                <div class="info-grid">
                  <div>
                    <div class="info-item">
                      <span class="info-label">Cliente:</span>
                      ${order.customer?.name || 'N/A'}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Creado:</span>
                      ${formatDateTime(order.createdAt)}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Entrega:</span>
                      ${formatDate(order.delivery_due)}
                    </div>
                  </div>
                  <div>
                    ${order.location ? `
                      <div class="info-item">
                        <span class="info-label">Lugar:</span>
                        ${order.location}
                      </div>
                    ` : ''}
                    <div class="info-item">
                      <span class="info-label">Vendedor:</span>
                      ${order.createdBy?.name || 'N/A'}
                    </div>
                    ${order.delivered_at ? `
                      <div class="info-item">
                        <span class="info-label">Entregado:</span>
                        ${formatDateTime(order.delivered_at)}
                      </div>
                    ` : ''}
                  </div>
                </div>

                <table class="products-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items?.map(item => `
                      <tr>
                        <td>
                          <strong>${item.product?.name || 'Producto eliminado'}</strong>
                          ${item.brand ? `<br><small>Marca: ${item.brand}</small>` : ''}
                          ${item.format ? `<br><small>Formato: ${item.format}</small>` : ''}
                        </td>
                        <td>${item.quantity} ${item.unit_of_measure}</td>
                        <td>${formatCLP(item.unit_price)}</td>
                        <td>${formatCLP(item.quantity * item.unit_price)}</td>
                      </tr>
                    `).join('') || '<tr><td colspan="4">No hay productos</td></tr>'}
                    <tr class="total-row">
                      <td colspan="3"><strong>TOTAL</strong></td>
                      <td><strong>${formatCLP(order.total)}</strong></td>
                    </tr>
                  </tbody>
                </table>

                ${order.notes ? `
                  <div class="notes">
                    <div class="notes-label">📝 Observaciones:</div>
                    ${order.notes}
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}

          <script>
            window.onload = function() {
              // Configurar para PDF automáticamente
              setTimeout(() => {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !search.trim() ||
      order.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      toast.success(`Estado cambiado a ${newStatus}`);
      await loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      await ordersAPI.markDelivered(orderId);
      toast.success('Pedido marcado como entregado');
      await loadOrders();
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error('Error al marcar como entregado');
    }
  };

  const canManage = user?.role === 'facturador' || user?.role === 'admin';
  const canViewAll = user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600">
            {filteredOrders.length} pedidos encontrados
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => printOrders(filteredOrders.filter(o => o.status === 'pendiente'))}
            disabled={!filteredOrders.some(o => o.status === 'pendiente')}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Pendientes (PDF)
          </Button>
          <Button
            variant="outline"
            onClick={() => printOrders(filteredOrders.filter(o => o.status === 'facturado'))}
            disabled={!filteredOrders.some(o => o.status === 'facturado')}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Facturados (PDF)
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Buscar por cliente o número de pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="compra">Compra</option>
            <option value="facturado">Facturado</option>
            <option value="nulo">Nulo</option>
          </Select>
        </div>
      </Card>

      {/* Lista de pedidos */}
      <Card>
        {filteredOrders.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Pedido</Table.Head>
                <Table.Head>Cliente</Table.Head>
                <Table.Head>Items</Table.Head>
                <Table.Head>Estado</Table.Head>
                <Table.Head>Entrega</Table.Head>
                <Table.Head>Total</Table.Head>
                {canManage && <Table.Head>Acciones</Table.Head>}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredOrders.map((order) => {
                const deliveryStatus = getDeliveryStatus(order);
                const createdDate = new Date(order.createdAt);
                const today = new Date();
                const daysDiff = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
                const canNullify = daysDiff >= 7 && (order.status === 'pendiente' || order.status === 'compra');

                return (
                  <Table.Row key={order._id}>
                    <Table.Cell>
                      <div>
                        <div className="font-medium">{order.order_number}</div>
                        <div className="text-sm text-gray-500">
                          {formatDateTime(order.createdAt)}
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="font-medium">{order.customer?.name}</div>
                      {order.location && (
                        <div className="text-sm text-gray-500">{order.location}</div>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-sm">
                        {order.items?.length || 0} productos
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={order.status} size="sm">
                        {order.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-sm">
                        <div>{formatDateTime(order.delivery_due)}</div>
                        {deliveryStatus === 'vencido' && (
                          <div className="text-red-600 font-medium">Vencido</div>
                        )}
                        {order.delivered_at && (
                          <div className="text-green-600">
                            Entregado: {formatDateTime(order.delivered_at)}
                          </div>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="font-semibold text-emerald-600">
                        {formatCLP(order.total)}
                      </div>
                    </Table.Cell>
                    {canManage && (
                      <Table.Cell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => printSingleOrder(order)}
                            title="Generar PDF del pedido"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingOrder(order)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {order.status === 'facturado' && !order.delivered_at && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkDelivered(order._id)}
                            >
                              Entregar
                            </Button>
                          )}
                        </div>
                      </Table.Cell>
                    )}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || statusFilter ? 'Sin resultados' : 'No hay pedidos'}
            </h3>
            <p className="text-gray-500">
              {search || statusFilter
                ? 'No se encontraron pedidos con esos filtros'
                : 'Los pedidos aparecerán aquí una vez creados'
              }
            </p>
          </div>
        )}
      </Card>

      {/* Modal para editar pedido */}
      <EditOrderModal
        isOpen={!!editingOrder}
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSuccess={(updatedOrder) => {
          setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
          setEditingOrder(null);
          toast.success('Pedido actualizado exitosamente');
        }}
      />
    </div>
  );
};

// Modal para editar pedido
const EditOrderModal = ({ isOpen, order, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    status: '',
    location: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const canEditLocation = user?.role === 'facturador' || user?.role === 'admin';

  useEffect(() => {
    if (order) {
      setFormData({
        status: order.status || '',
        location: order.location || '',
        notes: order.notes || ''
      });
    }
  }, [order]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await ordersAPI.update(order._id, formData);
      onSuccess(response.data);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.message || 'Error al actualizar pedido');
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  return (
    <Modal title={`Editar Pedido ${order.order_number}`} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información del cliente (solo lectura) */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
          <p><span className="font-medium">Cliente:</span> {order.customer?.name}</p>
          <p><span className="font-medium">Fecha de entrega:</span> {formatDateTime(order.delivery_due)}</p>
          <p><span className="font-medium">Total:</span> {formatCLP(order.total)}</p>
        </div>

        {/* Items del pedido (solo lectura) */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Productos</h4>
          {order.items?.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm py-1">
              <span>{item.product?.name || 'Producto eliminado'}</span>
              <span>{item.quantity} {item.unit_of_measure} × {formatCLP(item.unit_price)}</span>
            </div>
          ))}
        </div>

        {/* Estado */}
        <Select
          label="Estado"
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
          required
        >
          <option value="pendiente">Pendiente</option>
          <option value="compra">Compra</option>
          <option value="facturado">Facturado</option>
          <option value="nulo">Nulo</option>
        </Select>

        {/* Campo Lugar - solo para facturador */}
        {canEditLocation && (
          <Input
            label="Lugar"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Especificar ubicación de entrega"
            maxLength={200}
          />
        )}

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            maxLength={1000}
            placeholder="Observaciones adicionales..."
          />
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Actualizar Pedido
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Orders;