import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { formatCLP } from '../lib/utils';
import { customersAPI, productsAPI, ordersAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const NewOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Estado principal
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Formulario
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [deliveryDue, setDeliveryDue] = useState('');
  const [notes, setNotes] = useState('');
  
  // Estados auxiliares
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
    // Fecha por defecto: 3 días desde hoy
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    setDeliveryDue(defaultDate.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        customersAPI.getAll({ active: true }),
        productsAPI.getAll({ active: true })
      ]);
      
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      toast.error('Error cargando datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos por búsqueda
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 10);
    
    const search = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.sku.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [products, productSearch]);

  // Obtener producto seleccionado
  const currentProduct = products.find(p => p._id === selectedProduct);

  // Auto-completar precio cuando se selecciona producto
  useEffect(() => {
    if (currentProduct && !unitPrice) {
      setUnitPrice(currentProduct.unit_price.toString());
    }
  }, [currentProduct, unitPrice]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product._id);
    setProductSearch(product.name);
    setUnitPrice(product.unit_price.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error('Selecciona un cliente');
      return;
    }
    
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    if (quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (!unitPrice || Number(unitPrice) <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    try {
      setSubmitting(true);
      
      const orderData = {
        customer: selectedCustomer,
        items: [{
          product: selectedProduct,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          unit_of_measure: currentProduct?.unit_of_measure || 'unidad',
          brand: currentProduct?.brand || '',
          format: currentProduct?.format || ''
        }],
        delivery_due: new Date(deliveryDue).toISOString(),
        notes: notes.trim()
      };

      await ordersAPI.create(orderData);
      
      toast.success('¡Pedido creado exitosamente!');
      navigate('/');
      
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Manejar duplicados
      if (error.response?.status === 409 && error.response.data?.duplicates) {
        setDuplicateModal({
          duplicates: error.response.data.duplicates,
          orderData: orderData
        });
        return;
      }
      
      toast.error(error.message || 'Error al crear el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer('');
    setProductSearch('');
    setSelectedProduct('');
    setQuantity(1);
    setUnitPrice('');
    setNotes('');
  };

  const handleDuplicateAction = async (action) => {
    if (!duplicateModal) return;
    
    try {
      setSubmitting(true);
      const orderData = {
        ...duplicateModal.orderData,
        handleDuplicates: action
      };
      
      if (action === 'merge') {
        await ordersAPI.create(orderData);
        toast.success('¡Cantidades sumadas al pedido existente!');
      } else {
        // Crear nueva línea ignorando duplicados
        await ordersAPI.create({ ...orderData, handleDuplicates: 'ignore' });
        toast.success('¡Nueva línea creada!');
      }
      
      setDuplicateModal(null);
      navigate('/');
    } catch (error) {
      toast.error('Error al procesar el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const canCreate = user?.role === 'vendedor' || user?.role === 'admin';

  if (!canCreate) {
    return (
      <Card title="Sin permisos" className="text-center">
        <p className="text-gray-600">Solo vendedores y administradores pueden crear pedidos.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Pedido</h1>
          <p className="text-gray-600">Crea un nuevo pedido de forma rápida</p>
        </div>
        <Button variant="secondary" onClick={resetForm}>
          Limpiar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <Card title="Cliente" padding={true}>
          <div className="flex gap-3">
            <Select
              label="Seleccionar cliente"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="flex-1"
              required
            >
              <option value="">— Selecciona un cliente —</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} {customer.tax_id && `(${customer.tax_id})`}
                </option>
              ))}
            </Select>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowNewCustomer(true)}
              className="mt-6"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Producto */}
        <Card title="Producto" padding={true}>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Buscar producto"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setSelectedProduct('');
                    setUnitPrice('');
                  }}
                  placeholder="Buscar por nombre o SKU..."
                  required
                />
                
                {/* Lista de productos */}
                {productSearch && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-auto bg-white shadow-sm">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => handleProductSelect(product)}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                            selectedProduct === product._id ? 'bg-emerald-50' : ''
                          }`}
                        >
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            SKU: {product.sku} • {formatCLP(product.unit_price)}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        Sin resultados
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewProduct(true)}
                          className="ml-2"
                        >
                          Crear producto
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewProduct(true)}
                className="mt-6"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Detalles del producto seleccionado */}
            {currentProduct && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <strong>{currentProduct.name}</strong>
                  {currentProduct.brand && <span> • {currentProduct.brand}</span>}
                  {currentProduct.format && <span> • {currentProduct.format}</span>}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Precio sugerido: {formatCLP(currentProduct.unit_price)}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Detalles del pedido */}
        <Card title="Detalles" padding={true}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Cantidad"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              required
            />
            <Input
              label="Precio unitario"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="Precio por unidad"
              required
            />
            <Input
              label="Fecha de entrega"
              type="date"
              value={deliveryDue}
              onChange={(e) => setDeliveryDue(e.target.value)}
              required
            />
          </div>

          {/* Total */}
          {unitPrice && quantity && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total del pedido:</span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatCLP(Number(unitPrice) * Number(quantity))}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Input
              label="Observaciones (opcional)"
              as="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales del pedido..."
            />
          </div>
        </Card>

        {/* Acciones */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={!selectedCustomer || !selectedProduct}
          >
            Crear Pedido
          </Button>
        </div>
      </form>

      {/* Modales */}
      <NewCustomerModal
        isOpen={showNewCustomer}
        onClose={() => setShowNewCustomer(false)}
        onSuccess={(customer) => {
          setCustomers(prev => [customer, ...prev]);
          setSelectedCustomer(customer._id);
          setShowNewCustomer(false);
        }}
      />

      <NewProductModal
        isOpen={showNewProduct}
        onClose={() => setShowNewProduct(false)}
        onSuccess={(product) => {
          setProducts(prev => [product, ...prev]);
          handleProductSelect(product);
          setShowNewProduct(false);
        }}
      />

      {/* Modal de duplicados */}
      <DuplicateModal
        isOpen={!!duplicateModal}
        duplicates={duplicateModal?.duplicates}
        onClose={() => setDuplicateModal(null)}
        onMerge={() => handleDuplicateAction('merge')}
        onCreate={() => handleDuplicateAction('ignore')}
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
      const response = await customersAPI.create(formData);
      toast.success('Cliente creado exitosamente');
      onSuccess(response.data);
    } catch (error) {
      toast.error(error.message || 'Error al crear cliente');
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

// Modal para nuevo producto  
const NewProductModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    brand: '',
    format: '',
    unit_price: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (!formData.unit_price || Number(formData.unit_price) <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    try {
      setSaving(true);
      const productData = {
        ...formData,
        unit_price: Number(formData.unit_price),
        sku: formData.sku || `SKU-${Date.now()}`
      };
      
      const response = await productsAPI.create(productData);
      toast.success('Producto creado exitosamente');
      onSuccess(response.data);
    } catch (error) {
      toast.error(error.message || 'Error al crear producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Nuevo Producto" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <Input
          label="SKU (opcional)"
          value={formData.sku}
          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
          placeholder="Se generará automáticamente si está vacío"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Marca (opcional)"
            value={formData.brand}
            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
          />
          <Input
            label="Formato (opcional)"
            value={formData.format}
            onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
          />
        </div>
        <Input
          label="Precio"
          type="number"
          min="0"
          step="0.01"
          value={formData.unit_price}
          onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
          required
        />
        
        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Crear Producto
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal para manejar duplicados
const DuplicateModal = ({ isOpen, duplicates, onClose, onMerge, onCreate }) => {
  if (!duplicates) return null;
  
  return (
    <Modal title="Producto duplicado detectado" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Ya existe un pedido del mismo cliente con este producto creado hoy. 
          ¿Qué deseas hacer?
        </p>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium">Producto duplicado:</p>
          <p className="text-sm text-gray-600">
            Cantidad existente: {duplicates[0]?.existingQty}
          </p>
          <p className="text-sm text-gray-600">
            Nueva cantidad: {duplicates[0]?.newQty}
          </p>
          <p className="text-sm text-gray-600">
            Total si se suman: {(duplicates[0]?.existingQty || 0) + (duplicates[0]?.newQty || 0)}
          </p>
        </div>
        
        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="outline" onClick={onCreate}>
            Crear nueva línea
          </Button>
          <Button type="button" onClick={onMerge}>
            Sumar cantidades
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NewOrder;