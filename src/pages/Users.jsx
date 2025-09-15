import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  Shield,
  User,
  Crown,
  Briefcase
} from 'lucide-react';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { formatDateTime, formatRelativeTime } from '../lib/utils';
import { usersAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const Users = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vendedor'
  });
  const [newCredentials, setNewCredentials] = useState(null);

  useEffect(() => {
    loadData();
  }, [searchTerm, roleFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        usersAPI.getAll({ search: searchTerm, role: roleFilter }),
        usersAPI.getStats()
      ]);

      // Manejo seguro de la respuesta
      const usersData = usersResponse?.data || [];
      const statsData = statsResponse?.data || null;

      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
      // En caso de error, asegurar que users esté como array vacío
      setUsers([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      console.log('📤 Enviando datos de usuario:', newUserData);

      // Validar datos antes de enviar
      if (!newUserData.name || !newUserData.email || !newUserData.password || !newUserData.role) {
        toast.error('Todos los campos son requeridos');
        return;
      }

      const response = await usersAPI.create(newUserData);
      console.log('✅ Usuario creado exitosamente:', response);

      toast.success('Usuario creado exitosamente');
      setNewCredentials(response?.data?.credentials || null);
      setNewUserData({ name: '', email: '', password: '', role: 'vendedor' });
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error('❌ Error creating user:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);

      const errorMessage = error.response?.data?.message || 'Error al crear usuario';
      toast.error(errorMessage);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.update(selectedUser._id, {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        isActive: selectedUser.isActive
      });
      toast.success('Usuario actualizado exitosamente');
      setShowEditModal(false);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${userName}"?`)) return;

    try {
      await usersAPI.delete(userId);
      toast.success('Usuario eliminado exitosamente');
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar usuario');
    }
  };



  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: <Crown className="w-4 h-4" />,
      facturador: <Briefcase className="w-4 h-4" />,
      vendedor: <User className="w-4 h-4" />
    };
    return icons[role] || icons.vendedor;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-gradient-to-r from-purple-500 to-pink-500',
      facturador: 'bg-gradient-to-r from-amber-500 to-orange-500',
      vendedor: 'bg-gradient-to-r from-blue-500 to-indigo-500'
    };
    return colors[role] || colors.vendedor;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Acceso Restringido</h2>
          <p className="text-gray-500">Solo los administradores pueden acceder a esta sección</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <UsersIcon className="w-8 h-8 mr-3" />
              Gestión de Usuarios
            </h1>
            <p className="text-purple-100 text-lg">Administra las cuentas del sistema</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-purple-700 hover:bg-gray-50 shadow-lg font-semibold px-6 py-3"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-600">Activos</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
            <p className="text-sm text-gray-600">Admins</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.facturadores}</p>
            <p className="text-sm text-gray-600">Facturadores</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.vendedores}</p>
            <p className="text-sm text-gray-600">Vendedores</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="facturador">Facturadores</option>
            <option value="vendedor">Vendedores</option>
          </select>
          <Button variant="outline" onClick={loadData}>
            <Search className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </Card>

      {/* Users List */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Usuarios del Sistema</h2>
          <p className="text-sm text-gray-500">Lista de todos los usuarios registrados</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : users?.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {users?.map((userItem) => (
              <div key={userItem._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getRoleColor(userItem.role)}`}>
                      {userItem.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{userItem.name}</h3>
                        <Badge
                          className={`${getRoleColor(userItem.role)} text-white text-xs`}
                        >
                          <span className="mr-1">{getRoleIcon(userItem.role)}</span>
                          {userItem.role}
                        </Badge>
                        {!userItem.isActive && (
                          <Badge variant="destructive" size="sm">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600">{userItem.email}</p>
                      <p className="text-sm text-gray-500">
                        Creado {formatRelativeTime(userItem.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(userItem);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {userItem._id !== user.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(userItem._id, userItem.name)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron usuarios</p>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Usuario"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={newUserData.name}
              onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={newUserData.email}
              onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={newUserData.password}
              onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Ingresa una contraseña"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={newUserData.role}
              onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="vendedor">Vendedor</option>
              <option value="facturador">Facturador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {selectedUser && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Editar Usuario"
          size="md"
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={selectedUser.name}
                onChange={(e) => setSelectedUser(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={selectedUser.email}
                onChange={(e) => setSelectedUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={selectedUser.role}
                onChange={(e) => setSelectedUser(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="vendedor">Vendedor</option>
                <option value="facturador">Facturador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedUser.isActive}
                  onChange={(e) => setSelectedUser(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Usuario activo</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Actualizar Usuario
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Credentials Modal */}
      {newCredentials && (
        <Modal
          isOpen={!!newCredentials}
          onClose={() => setNewCredentials(null)}
          title="Credenciales de Acceso"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-3">
                ¡Usuario creado/actualizado exitosamente!
              </p>
              <p className="text-green-700 text-sm mb-4">
                Comparte estas credenciales con el usuario:
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email:</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={newCredentials.email}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newCredentials.email)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Contraseña:</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={newCredentials.password}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newCredentials.password)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-xs">
                  <strong>Importante:</strong> Guarda estas credenciales en un lugar seguro.
                  Por seguridad, no se volverán a mostrar.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setNewCredentials(null)}>
                Entendido
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Users;