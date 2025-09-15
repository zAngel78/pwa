import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Plus,
  Package,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Printer,
  ShoppingCart
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import NotificationManager from '../NotificationManager';
import useAuthStore from '../../stores/authStore';

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
    { name: 'Nuevo Pedido', href: '/orders/new', icon: Plus },
    { name: 'Productos', href: '/products', icon: Package },
    { name: 'Clientes', href: '/customers', icon: Users },
    ...(user?.role === 'admin' ? [{ name: 'Usuarios', href: '/users', icon: User }] : []),
  ];

  const handleLogout = () => {
    logout();
  };

  const handlePrint = () => {
    window.print();
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      facturador: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      vendedor: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
    };
    return colors[role] || colors.vendedor;
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: '👑',
      facturador: '📊',
      vendedor: '💼',
    };
    return icons[role] || icons.vendedor;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título compacto */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                  <Package className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Pedidos
                </h1>
                <p className="text-xs text-emerald-600 font-medium">
                  Sistema
                </p>
              </div>
            </Link>
          </div>

          {/* Navegación desktop compacta */}
          <nav className="hidden lg:flex items-center bg-gray-50/50 rounded-xl p-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    relative flex items-center space-x-1 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-300 group
                    ${isActive
                      ? 'bg-white text-emerald-700 shadow-md'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-white/60'
                    }
                  `}
                >
                  <Icon className={`w-3 h-3 transition-colors ${isActive ? 'text-emerald-600' : 'group-hover:text-emerald-500'}`} />
                  <span className="hidden xl:inline">{item.name}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Usuario y acciones compactos */}
          <div className="flex items-center space-x-2">
            {/* Información del usuario compacta */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-900">
                  {user?.name}
                </p>
                <div className="flex items-center justify-end space-x-1">
                  <span className="text-xs">{getRoleIcon(user?.role)}</span>
                  <Badge
                    variant="default"
                    className={`${getRoleColor(user?.role)} text-xs px-1 py-0.5 font-medium shadow-sm`}
                  >
                    {user?.role}
                  </Badge>
                </div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Botones de acción compactos */}
            <div className="flex items-center space-x-1">
              <NotificationManager user={user} />

              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="hidden md:flex p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Imprimir"
              >
                <Printer className="w-4 h-4 text-gray-600" />
              </Button>

              {/* Botón logout siempre visible */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </Button>

              {/* Menú móvil */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4 text-gray-600" />
                ) : (
                  <Menu className="w-4 h-4 text-gray-600" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Menú móvil modernizado */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl">
            {/* Información del usuario en móvil */}
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {user?.name}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">{getRoleIcon(user?.role)}</span>
                    <Badge
                      variant="default"
                      className={`${getRoleColor(user?.role)} text-xs px-2 py-1 font-medium shadow-md`}
                    >
                      {user?.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Navegación móvil */}
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50/50'
                      }
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Acciones móviles modernizadas */}
            <div className="px-4 py-4 border-t border-gray-100 space-y-2">
              <button
                onClick={() => {
                  handlePrint();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-xl text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-5 h-5 text-gray-500" />
                <span>Imprimir Página</span>
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-xl text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          header, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          .shadow, .shadow-sm, .shadow-lg {
            box-shadow: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;