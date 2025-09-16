import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
// import { formatCLP } from '../lib/utils'; // Eliminado - sin precios para logística
import { customersAPI, productsAPI, ordersAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const NewOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Estado principal
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Formulario principal
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [deliveryDue, setDeliveryDue] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Lista de productos del pedido
  const [items, setItems] = useState([]);

  // Formulario temporal para agregar producto
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitOfMeasure, setUnitOfMeasure] = useState('unidad');
  const [brand, setBrand] = useState('');
  const [format, setFormat] = useState('');
  const [productNotes, setProductNotes] = useState('');
  
  // Estados auxiliares
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  // Funciones para manejar múltiples productos
  const addProductToOrder = () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    if (items.length >= 20) {
      toast.error('No se pueden agregar más de 20 productos por pedido');
      return;
    }

    const product = products.find(p => p._id === selectedProduct);
    const newItem = {
      product: selectedProduct,
      productName: product.name,
      quantity: Number(quantity),
      unit_of_measure: unitOfMeasure,
      brand: brand || product.brand || '',
      format: format || product.format || '',
      notes: productNotes
    };

    setItems([...items, newItem]);

    // Limpiar formulario temporal
    setSelectedProduct('');
    setProductSearch('');
    setQuantity(1);
    setUnitOfMeasure('unidad');
    setBrand('');
    setFormat('');
    setProductNotes('');

    toast.success('Producto agregado al pedido');
  };

  const removeProductFromOrder = (index) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Producto eliminado del pedido');
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

  // Auto-completar datos cuando se selecciona producto
  useEffect(() => {
    if (currentProduct) {
      setBrand(currentProduct.brand || '');
      setFormat(currentProduct.format || '');
      setUnitOfMeasure(currentProduct.unit_of_measure || 'unidad');
    }
  }, [currentProduct]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product._id);
    setProductSearch(product.name);
    setUnitOfMeasure(product.unit_of_measure || 'unidad');
    setBrand(product.brand || '');
    setFormat(product.format || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!selectedCustomer) {
      toast.error('Selecciona un cliente');
      return;
    }

    if (items.length === 0) {
      toast.error('Agrega al menos un producto al pedido');
      return;
    }

    if (!deliveryDue) {
      toast.error('Selecciona una fecha de entrega');
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
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit_of_measure: item.unit_of_measure,
          brand: item.brand.trim(),
          format: item.format.trim(),
          notes: item.notes.trim()
        })),
        delivery_due: new Date(deliveryDue).toISOString(),
        order_number: orderNumber.trim(),
        notes: notes.trim()
      };

      const response = await ordersAPI.create(orderData);

      // Verificar si fue una consolidación automática
      if (response.data.merged && response.data.merged > 0) {
        toast.success(`¡Productos agregados al pedido existente! (${response.data.merged} productos consolidados)`);
      } else {
        toast.success('¡Pedido creado exitosamente!');
      }

      navigate('/');

    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Error al crear el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer('');
    setItems([]);
    setProductSearch('');
    setSelectedProduct('');
    setQuantity(1);
    setUnitOfMeasure('unidad');
    setBrand('');
    setFormat('');
    setProductNotes('');
    setOrderNumber('');
    setNotes('');
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
                            SKU: {product.sku} {product.brand && `• ${product.brand}`}
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
                  SKU: {currentProduct.sku}
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

          <Input
            label="Observaciones del producto (opcional)"
            as="textarea"
            rows={2}
            value={productNotes}
            onChange={(e) => setProductNotes(e.target.value)}
            placeholder="Notas específicas para este producto..."
          />

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={addProductToOrder}
              disabled={!selectedProduct}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto ({items.length}/20)
            </Button>
          </div>


        </Card>

        {/* Lista de productos agregados */}
        {items.length > 0 && (
          <Card title={`Productos en el pedido (${items.length}/20)`} padding={true}>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.productName}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.quantity} {item.unit_of_measure}
                      {item.brand && ` • ${item.brand}`}
                      {item.format && ` • ${item.format}`}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-gray-600 mt-1 italic">
                        "{item.notes}"
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProductFromOrder(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Información del pedido */}
        <Card title="Datos del Pedido" padding={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Fecha de entrega"
              type="date"
              value={deliveryDue}
              onChange={(e) => setDeliveryDue(e.target.value)}
              required
            />
            <Input
              label="Nro de Orden (opcional)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Número de orden interno"
            />
          </div>

          <Input
            label="Observaciones del pedido (opcional)"
            as="textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales del pedido completo..."
          />
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
            disabled={!selectedCustomer || items.length === 0}
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


      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        orderData={{
          customer: customers.find(c => c._id === selectedCustomer),
          delivery_due: deliveryDue,
          items: items,
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

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="font-medium text-gray-600">Cliente:</span>
              <p className="text-gray-900">{orderData.customer?.name || 'No seleccionado'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Fecha de Entrega:</span>
              <p className="text-gray-900">{orderData.delivery_due || 'No establecida'}</p>
            </div>
          </div>

          {/* Lista de productos */}
          <div>
            <span className="font-medium text-gray-600">Productos ({orderData.items?.length || 0}):</span>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
              {orderData.items?.map((item, index) => (
                <div key={index} className="p-2 bg-white rounded border text-sm">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-gray-600 text-xs">
                    {item.quantity} {item.unit_of_measure}
                    {item.brand && ` • ${item.brand}`}
                    {item.format && ` • ${item.format}`}
                  </div>
                  {item.notes && (
                    <div className="text-gray-500 text-xs italic mt-1">
                      "{item.notes}"
                    </div>
                  )}
                </div>
              )) || (
                <p className="text-gray-500 text-sm">No hay productos agregados</p>
              )}
            </div>
          </div>

          {orderData.orderNumber && (
            <div>
              <span className="font-medium text-gray-600">Número de Orden:</span>
              <p className="text-gray-900">{orderData.orderNumber}</p>
            </div>
          )}

          {orderData.notes && (
            <div>
              <span className="font-medium text-gray-600">Observaciones del pedido:</span>
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