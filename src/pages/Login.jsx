import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useAuthStore from '../stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuthStore();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Redireccionar si ya está autenticado
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onLoginSubmit = async (data) => {
    console.log('🔑 Intentando login con:', data);
    const result = await login(data.email, data.password);
    console.log('📝 Resultado del login:', result);
    
    if (result.success) {
      console.log('✅ Login exitoso');
      toast.success('¡Bienvenido!');
    } else {
      console.error('❌ Error en login:', result.error);
      toast.error(result.error || 'Error al iniciar sesión');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Pedidos y Facturación
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              {...loginForm.register('email')}
              error={loginForm.formState.errors.email?.message}
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...loginForm.register('password')}
                error={loginForm.formState.errors.password?.message}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          {/* Información del sistema */}
          <div className="mt-6 p-3 bg-emerald-50 rounded-lg">
            <h4 className="text-sm font-medium text-emerald-900 mb-2">Sistema de Gestión Logística</h4>
            <p className="text-xs text-emerald-800">
              Plataforma para gestión de pedidos, productos y clientes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Sistema profesional desarrollado con MongoDB + React
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;