import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  isOwner: boolean;
}

interface AuthState {
  user: User | null;
  tenant: TenantInfo | null;
  tenants: TenantInfo[];
  tenantId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  selectTenant: (tenant: TenantInfo) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      tenants: [],
      tenantId: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response: any = await api.post('/auth/login', { email, password });
          const payload = response.data || response;

          set({
            user: payload.user,
            tenants: payload.tenants || [],
            accessToken: payload.accessToken || null,
            refreshToken: payload.refreshToken || null,
            isAuthenticated: true,
          });

          if (payload.tenants?.length > 0) {
            const firstTenant = payload.tenants[0];
            set({
              tenant: firstTenant,
              tenantId: firstTenant.id,
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        const refreshToken = get().refreshToken;
        api.post('/auth/logout', { refreshToken }).catch(() => {});
        set({
          user: null,
          tenant: null,
          tenants: [],
          tenantId: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      selectTenant: (tenant: TenantInfo) => {
        set({ tenant, tenantId: tenant.id });
      },
    }),
    {
      name: 'plataforma-auth-mobile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        tenants: state.tenants,
        tenantId: state.tenantId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
