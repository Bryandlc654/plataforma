import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
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

  setUser: (user: User) => void;
  ensureSession: () => Promise<boolean>;
  selectTenant: (tenant: TenantInfo) => void;
  clearTenant: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ success: boolean }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  fetchTenants: () => Promise<void>;
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

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      ensureSession: async () => {
        if (get().isAuthenticated && get().user) return true;
        try {
          const res: any = await api.get("/auth/me");
          const user = res?.data || res;
          if (!user?.id) throw new Error("Invalid session");
          set({ user, isAuthenticated: true });
          return true;
        } catch {
          set({ user: null, isAuthenticated: false });
          return false;
        }
      },

      selectTenant: (tenant: TenantInfo) => {
        set({ tenant, tenantId: tenant.id });
      },

      clearTenant: () => {
        set({ tenant: null, tenantId: null });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response: any = await api.post("/auth/login", { email, password });
          const payload = response.data || response;

          set({
            user: payload.user,
            tenants: payload.tenants || [],
            accessToken: payload.accessToken || null,
            refreshToken: payload.refreshToken || null,
            isAuthenticated: true,
          });

          if (typeof document !== "undefined") {
            document.cookie = `auth_session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          }

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

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response: any = await api.post("/auth/register", data);
          const payload = response.data || response;

          set({
            user: payload.user,
            tenants: payload.tenants || (payload.tenant ? [{ ...payload.tenant, isOwner: true }] : []),
            accessToken: payload.accessToken || null,
            refreshToken: payload.refreshToken || null,
            isAuthenticated: true,
          });

          if (typeof document !== "undefined") {
            document.cookie = `auth_session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          }

          if (payload.tenant) {
            set({
              tenant: { ...payload.tenant, isOwner: true },
              tenantId: payload.tenant.id,
            });
          }

          return { success: true };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        api.post("/auth/logout").catch(() => {});
        if (typeof document !== "undefined") {
          document.cookie = "auth_session=; path=/; max-age=0";
        }
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

      refreshAuth: async () => {
        try {
          const response: any = await api.post("/auth/refresh", { refreshToken: get().refreshToken });
          const payload = response.data || response;
          set({
            accessToken: payload.accessToken || get().accessToken,
            refreshToken: payload.refreshToken || get().refreshToken,
          });
        } catch {
          get().logout();
        }
      },

      fetchTenants: async () => {
        try {
          const response: any = await api.get("/users/tenants");
          const tenants = response.data || response;
          set({ tenants });
        } catch {
          // silent
        }
      },
    }),
    {
      name: "plataforma-auth",
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        tenants: state.tenants,
        tenantId: state.tenantId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
