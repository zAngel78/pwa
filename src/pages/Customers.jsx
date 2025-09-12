import { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { customersAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const Customers = () => {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll({ active: true });
      setCustomers(response.data || []);
    } catch (error) {
      toast.error('Error cargando clientes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes
  const filteredCustomers = customers.filter(customer => {
    if (!search.trim()) return true;
    
    const searchTerm = search.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchTerm) ||
      (customer.tax_id || '').toLowerCase().includes(searchTerm) ||
      (customer.email || '').toLowerCase().includes(searchTerm)
    );
  });

  const handleDelete = async (customerId) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;
    
    try {
      await customersAPI.delete(customerId);
      toast.success('Cliente eliminado');
      await loadCustomers();
    } catch (error) {
      toast.error('Error al eliminar cliente');
    }
  };

  const canManage = user?.role === 'admin';
  const canCreate = user?.role === 'vendedor' || user?.role === 'admin';

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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">
            {customers.length} clientes registrados
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowNewCustomer(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Búsqueda */}
      <Card>
        <Input
          placeholder="Buscar por nombre, RUT o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Lista de clientes */}
      <Card>
        {filteredCustomers.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Cliente</Table.Head>
                <Table.Head>RUT</Table.Head>
                <Table.Head>Contacto</Table.Head>
                <Table.Head>Ubicación</Table.Head>
                {canManage && <Table.Head>Acciones</Table.Head>}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredCustomers.map((customer) => (
                <Table.Row key={customer._id}>
                  <Table.Cell>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      {customer.notes && (
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {customer.notes}
                        </div>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {customer.tax_id ? (
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {customer.tax_id}
                      </code>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      {customer.email && (
                        <div className="text-sm">{customer.email}</div>
                      )}
                      {customer.phone && (
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      )}
                      {!customer.email && !customer.phone && (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {customer.address?.city ? (
                      <div className="text-sm">
                        <div>{customer.address.city}</div>
                        {customer.address.region && (
                          <div className="text-gray-500">{customer.address.region}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </Table.Cell>
                  {canManage && (
                    <Table.Cell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(customer._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? 'Sin resultados' : 'No hay clientes'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search 
                ? 'No se encontraron clientes con ese término de búsqueda'
                : 'Comienza agregando tu primer cliente'
              }
            </p>
            {canCreate && !search && (
              <Button onClick={() => setShowNewCustomer(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Cliente
              </Button>
            )}
          </div>
        )}
      </Card>

      {!canCreate && (
        <div className="text-center text-sm text-gray-500">
          Solo vendedores y administradores pueden crear clientes
        </div>
      )}

      {/* Modal para nuevo cliente */}
      <NewCustomerModal
        isOpen={showNewCustomer}
        onClose={() => setShowNewCustomer(false)}
        onSuccess={(customer) => {
          setCustomers(prev => [customer, ...prev]);
          setShowNewCustomer(false);
          toast.success('Cliente creado exitosamente');
        }}
      />
    </div>
  );
};

// Modal para nuevo cliente
const NewCustomerModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      setSaving(true);
      
      // Agregar campo notes que espera el backend
      const customerData = {
        ...formData,
        notes: ''
      };
      
      const response = await customersAPI.create(customerData);
      onSuccess(response.data);
    } catch (error) {
      console.error('Error creating customer:', error);
      
      // Mostrar detalles específicos del error de validación
      if (error.details && Array.isArray(error.details)) {
        const errorMessages = error.details.join(', ');
        toast.error(`Error de validación: ${errorMessages}`);
      } else {
        toast.error(error.message || 'Error al crear cliente');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Nuevo Cliente" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <Input
          label="RUT (opcional)"
          value={formData.tax_id}
          onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
          placeholder="12.345.678-9"
        />
        <Input
          label="Email (opcional)"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
        <Input
          label="Teléfono (opcional)"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        />
        
        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Crear Cliente
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Customers;