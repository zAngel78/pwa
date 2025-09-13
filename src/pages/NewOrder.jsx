import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle } from 'lucide-react';
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
  const [unitOfMeasure, setUnitOfMeasure] = useState('unidad');
  const [brand, setBrand] = useState('');
  const [format, setFormat] = useState('');
  const [deliveryDue, setDeliveryDue] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Estados auxiliares
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
    setUnitOfMeasure(product.unit_of_measure || 'unidad');
    setBrand(product.brand || '');
    setFormat(product.format || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas primero
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

    // Mostrar modal de confirmación antes de proceder
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }
  };

  const handleConfirmedSubmit = async () => {
    try {
      setSubmitting(true);
      setShowConfirmation(false);

      const orderData = {
        customer: selectedCustomer,
        items: [{
          product: selectedProduct,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          unit_of_measure: unitOfMeasure,
          brand: brand.trim(),
          format: format.trim()
        }],
        delivery_due: new Date(deliveryDue).toISOString(),
        order_number: orderNumber.trim(),
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
    setUnitOfMeasure('unidad');
    setBrand('');
    setFormat('');
    setOrderNumber('');
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
        {/* Estado y Fecha automáticos */}
        <Card title="Información del Pedido" padding={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-yellow-800 font-medium">Pendiente</span>
                <span className="text-xs text-gray-500 ml-2">(automático)</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-800">{new Date().toLocaleDateString('es-ES')}</span>
                <span className="text-xs text-gray-500 ml-2">(automática)</span>
              </div>
            </div>
          </div>
        </Card>

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
        <Card title="Detalles del Pedido" padding={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Cantidad"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              required
            />
            <Select
              label="Unidad de Medida"
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
              required
            >
              <option value="unidad">Unidad</option>
              <option value="par">Par</option>
              <option value="metro">Metro</option>
              <option value="caja">Caja</option>
              <option value="kg">Kilogramo</option>
              <option value="litro">Litro</option>
              <option value="pack">Pack</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Marca"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Marca del producto"
            />
            <Input
              label="Formato"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder="Formato del producto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nro de Orden (opcional)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Número de orden interno"
            />
            <div></div> {/* Espacio vacío */}
          </div>

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

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        orderData={{
          customer: customers.find(c => c._id === selectedCustomer),
          delivery_due: deliveryDue,
          selectedProduct: selectedProduct,
          quantity: quantity,
          unitOfMeasure: unitOfMeasure,
          unitPrice: unitPrice,
          brand: brand,
          format: format,
          orderNumber: orderNumber,
          notes: notes
        }}
        onConfirm={handleConfirmedSubmit}
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

    // Validaciones de cliente
    if (!formData.name.trim()) {
      toast.error('El nombre del cliente es requerido');
      return;
    }

    if (formData.name.trim().length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('El email no tiene un formato válido');
      return;
    }

    if (formData.tax_id && formData.tax_id.trim() && !/^[0-9]+[-|‐]{1}[0-9kK]{1}$|^[0-9]{1,2}[.]{1}[0-9]{3}[.]{1}[0-9]{3}[-|‐]{1}[0-9kK]{1}$/.test(formData.tax_id.trim())) {
      toast.error('El RUT debe tener formato válido (ej: 12.345.678-9)');
      return;
    }

    if (formData.phone && formData.phone.trim() && !/^[+]?[0-9\s()-]{7,15}$/.test(formData.phone.trim())) {
      toast.error('El teléfono debe tener un formato válido');
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
      toast.success('Cliente creado exitosamente');
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

    // Validaciones de producto
    if (!formData.name.trim()) {
      toast.error('El nombre del producto es requerido');
      return;
    }

    if (formData.name.trim().length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (!formData.unit_price || Number(formData.unit_price) <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    if (Number(formData.unit_price) > 9999999) {
      toast.error('El precio no puede exceder $9.999.999');
      return;
    }

    if (formData.sku && formData.sku.trim().length > 0 && formData.sku.trim().length < 3) {
      toast.error('El SKU debe tener al menos 3 caracteres');
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
    <Modal title="⚠️ Producto Duplicado Detectado" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h4 className="font-medium text-yellow-800">
              Mismo cliente, mismo producto, mismo día
            </h4>
          </div>
          <p className="text-sm text-yellow-700">
            Ya existe un pedido del mismo cliente con este producto creado hoy.
            Según las reglas del sistema, las cantidades deben sumarse en lugar de crear pedidos separados.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3">Resumen del Conflicto:</h5>
          <div className="space-y-2">
            {duplicates[0]?.productName && (
              <div className="mb-2 pb-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-900">
                  Producto: {duplicates[0].productName}
                </span>
                {duplicates[0]?.orderNumber && (
                  <p className="text-xs text-gray-500">
                    Pedido existente: {duplicates[0].orderNumber}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cantidad en pedido existente:</span>
              <span className="font-medium">
                {duplicates[0]?.existingQty} {duplicates[0]?.unitOfMeasure}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cantidad nueva a agregar:</span>
              <span className="font-medium">
                {duplicates[0]?.newQty} {duplicates[0]?.unitOfMeasure}
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-900">Total si se suman:</span>
              <span className="font-bold text-emerald-600">
                {(duplicates[0]?.existingQty || 0) + (duplicates[0]?.newQty || 0)} {duplicates[0]?.unitOfMeasure}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            💡 <strong>Recomendación:</strong> Sumar las cantidades es la opción recomendada según las reglas de negocio.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button
            type="button"
            onClick={onMerge}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            ✅ Sumar Cantidades (Recomendado)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCreate}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ➕ Crear Nueva Línea Separada
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ❌ Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Modal de confirmación de datos
const ConfirmationModal = ({ isOpen, onClose, orderData, onConfirm }) => {
  return (
    <Modal title="Confirmar Datos del Pedido" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h4 className="font-medium text-yellow-800">
              ¿Está seguro de los datos que está introduciendo?
            </h4>
          </div>
          <p className="text-sm text-yellow-700">
            Por favor revise cuidadosamente la información antes de continuar.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h5 className="font-medium text-gray-900">Resumen del Pedido:</h5>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Cliente:</span>
              <p className="text-gray-900">{orderData.customer?.name || 'No seleccionado'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Fecha de Entrega:</span>
              <p className="text-gray-900">{orderData.delivery_due || 'No establecida'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Producto:</span>
              <p className="text-gray-900">{orderData.selectedProduct?.name || 'No seleccionado'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Cantidad:</span>
              <p className="text-gray-900">{orderData.quantity} {orderData.unitOfMeasure}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Precio Unitario:</span>
              <p className="text-gray-900">{formatCLP(orderData.unitPrice)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Total:</span>
              <p className="text-gray-900 font-semibold">{formatCLP(orderData.quantity * orderData.unitPrice)}</p>
            </div>
          </div>

          {orderData.brand && (
            <div>
              <span className="font-medium text-gray-600">Marca:</span>
              <p className="text-gray-900">{orderData.brand}</p>
            </div>
          )}

          {orderData.format && (
            <div>
              <span className="font-medium text-gray-600">Formato:</span>
              <p className="text-gray-900">{orderData.format}</p>
            </div>
          )}

          {orderData.orderNumber && (
            <div>
              <span className="font-medium text-gray-600">Número de Orden:</span>
              <p className="text-gray-900">{orderData.orderNumber}</p>
            </div>
          )}

          {orderData.notes && (
            <div>
              <span className="font-medium text-gray-600">Observaciones:</span>
              <p className="text-gray-900">{orderData.notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Revisar Datos
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirmar y Crear Pedido
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NewOrder;