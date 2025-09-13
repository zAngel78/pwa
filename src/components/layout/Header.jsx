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
  ];

  const handleLogout = () => {
    logout();
  };

  const handlePrint = () => {
    window.print();
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      facturador: 'bg-amber-100 text-amber-800',
      vendedor: 'bg-blue-100 text-blue-800',
    };
    return colors[role] || colors.vendedor;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Pedidos & Facturación
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Sistema Profesional
                </p>
              </div>
            </Link>
          </div>

          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Usuario y acciones */}
          <div className="flex items-center space-x-3">
            {/* Rol del usuario */}
            <Badge 
              variant="default" 
              className={getRoleColor(user?.role)}
            >
              {user?.role}
            </Badge>

            {/* Información del usuario */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center space-x-2">
              <NotificationManager user={user} />

              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="hidden sm:flex"
              >
                <Printer className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex"
              >
                <LogOut className="w-4 h-4" />
              </Button>

              {/* Menú móvil */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-colors
                      ${isActive 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Acciones móviles */}
              <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-2 px-3 py-2 w-full text-left rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Printer className="w-5 h-5" />
                  <span>Imprimir</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 w-full text-left rounded-lg text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
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