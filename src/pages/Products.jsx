import { useState, useEffect } from 'react';
import { Plus, Package, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { formatCLP } from '../lib/utils';
import { productsAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const Products = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll({ active: true });
      setProducts(response.data || []);
    } catch (error) {
      toast.error('Error cargando productos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    if (!search.trim()) return true;
    
    const searchTerm = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm) ||
      (product.brand || '').toLowerCase().includes(searchTerm)
    );
  });

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      await productsAPI.delete(productId);
      toast.success('Producto eliminado');
      await loadProducts();
    } catch (error) {
      toast.error('Error al eliminar producto');
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
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">
            {products.length} productos registrados
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowNewProduct(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        )}
      </div>

      {/* Búsqueda */}
      <Card>
        <Input
          placeholder="Buscar por nombre, SKU o marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Lista de productos */}
      <Card>
        {filteredProducts.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Producto</Table.Head>
                <Table.Head>SKU</Table.Head>
                <Table.Head>Marca</Table.Head>
                <Table.Head>Precio</Table.Head>
                <Table.Head>Stock</Table.Head>
                {canManage && <Table.Head>Acciones</Table.Head>}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredProducts.map((product) => (
                <Table.Row key={product._id}>
                  <Table.Cell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.format && (
                        <div className="text-sm text-gray-500">
                          {product.format}
                        </div>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {product.sku}
                    </code>
                  </Table.Cell>
                  <Table.Cell>{product.brand || '—'}</Table.Cell>
                  <Table.Cell>
                    <span className="font-semibold">
                      {formatCLP(product.unit_price)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center space-x-2">
                      <span>{product.stock?.current || 0}</span>
                      {product.isLowStock && (
                        <Badge variant="danger" size="sm">
                          Stock bajo
                        </Badge>
                      )}
                    </div>
                  </Table.Cell>
                  {canManage && (
                    <Table.Cell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(product._id)}
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
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? 'Sin resultados' : 'No hay productos'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search 
                ? 'No se encontraron productos con ese término de búsqueda'
                : 'Comienza agregando tu primer producto'
              }
            </p>
            {canCreate && !search && (
              <Button onClick={() => setShowNewProduct(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Producto
              </Button>
            )}
          </div>
        )}
      </Card>

      {!canCreate && (
        <div className="text-center text-sm text-gray-500">
          Solo vendedores y administradores pueden crear productos
        </div>
      )}

      {/* Modal para nuevo producto */}
      <NewProductModal
        isOpen={showNewProduct}
        onClose={() => setShowNewProduct(false)}
        onSuccess={(product) => {
          setProducts(prev => [product, ...prev]);
          setShowNewProduct(false);
          toast.success('Producto creado exitosamente');
        }}
      />

      {/* Modal para editar producto */}
      <EditProductModal
        isOpen={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={(updatedProduct) => {
          setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
          setEditingProduct(null);
          toast.success('Producto actualizado exitosamente');
        }}
      />
    </div>
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

// Modal para editar producto
const EditProductModal = ({ isOpen, product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    brand: '',
    format: '',
    unit_price: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        brand: product.brand || '',
        format: product.format || '',
        unit_price: product.unit_price?.toString() || ''
      });
    }
  }, [product]);

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
        unit_price: Number(formData.unit_price)
      };
      
      const response = await productsAPI.update(product._id, productData);
      onSuccess(response.data);
    } catch (error) {
      toast.error(error.message || 'Error al actualizar producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Editar Producto" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <Input
          label="SKU"
          value={formData.sku}
          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
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
            Actualizar Producto
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Products;