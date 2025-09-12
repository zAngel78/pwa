import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Acciones
      login: async (email, password) => {
        try {
          set({ isLoading: true });
          
          const response = await authAPI.login({ email, password });
          const { user, token } = response;

          // Guardar token en localStorage para el interceptor de axios
          localStorage.setItem('token', token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { 
            success: false, 
            error: error.message || 'Error al iniciar sesión' 
          };
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true });
          
          const response = await authAPI.register(userData);
          const { user, token } = response;

          localStorage.setItem('token', token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { 
            success: false, 
            error: error.message || 'Error al registrar usuario' 
          };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateProfile: async (profileData) => {
        try {
          set({ isLoading: true });
          
          const response = await authAPI.updateProfile(profileData);
          const { user } = response;

          set({
            user,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { 
            success: false, 
            error: error.message || 'Error al actualizar perfil' 
          };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          set({ isLoading: true });
          
          await authAPI.changePassword({
            currentPassword,
            newPassword,
          });

          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { 
            success: false, 
            error: error.message || 'Error al cambiar contraseña' 
          };
        }
      },

      // Verificar token al inicializar
      initializeAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
          const response = await authAPI.getMe();
          const { user } = response;

          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          // Token inválido, limpiar
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      // Getters
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.role);
      },

      canCreateOrders: () => {
        const { hasAnyRole } = get();
        return hasAnyRole(['vendedor', 'admin']);
      },

      canManageOrders: () => {
        const { hasAnyRole } = get();
        return hasAnyRole(['facturador', 'admin']);
      },

      canManageProducts: () => {
        const { hasRole } = get();
        return hasRole('admin');
      },

      canCreateCustomers: () => {
        const { hasAnyRole } = get();
        return hasAnyRole(['vendedor', 'admin']);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;