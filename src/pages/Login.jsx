import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import useAuthStore from '../stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['vendedor', 'facturador', 'admin']),
});

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isAuthenticated, isLoading } = useAuthStore();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@empresa.cl',
      password: '123456'
    }
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'vendedor'
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

  const onRegisterSubmit = async (data) => {
    const result = await register(data);
    
    if (result.success) {
      toast.success('¡Usuario registrado correctamente!');
    } else {
      toast.error(result.error || 'Error al registrar usuario');
    }
  };

  const roleOptions = [
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'facturador', label: 'Facturador' },
    { value: 'admin', label: 'Administrador' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Pedidos y Facturación
          </p>
          {!isRegister && (
            <p className="mt-1 text-xs text-gray-500">
              Demo: admin@empresa.cl / 123456
            </p>
          )}
        </div>

        {/* Formulario */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
          {!isRegister ? (
            // Formulario de login
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
          ) : (
            // Formulario de registro
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                {...registerForm.register('name')}
                error={registerForm.formState.errors.name?.message}
              />

              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                {...registerForm.register('email')}
                error={registerForm.formState.errors.email?.message}
              />

              <Select
                label="Rol"
                options={roleOptions}
                {...registerForm.register('role')}
                error={registerForm.formState.errors.role?.message}
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...registerForm.register('password')}
                  error={registerForm.formState.errors.password?.message}
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
                {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>
          )}

          {/* Toggle entre login y registro */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-emerald-600 hover:text-emerald-500 font-medium"
            >
              {isRegister 
                ? '¿Ya tienes cuenta? Inicia sesión' 
                : '¿No tienes cuenta? Regístrate'
              }
            </button>
          </div>

          {/* Información de roles */}
          {isRegister && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Roles disponibles:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li><strong>Vendedor:</strong> Crear pedidos, productos y clientes</li>
                <li><strong>Facturador:</strong> Cambiar estados y marcar entregas</li>
                <li><strong>Admin:</strong> Acceso completo al sistema</li>
              </ul>
            </div>
          )}
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