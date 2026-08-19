import axios from 'axios';

// We point to the production server by default. 
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://plataforma-api-j6ey.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const { useAuthStore } = require('../stores/auth-store');
  const state = useAuthStore.getState();
  
  if (state.tenantId) {
    config.headers['X-Tenant-Id'] = state.tenantId;
  }

  if (state.accessToken) {
    config.headers['Authorization'] = `Bearer ${state.accessToken}`;
  }

  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { useAuthStore } = require('../stores/auth-store');
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) return null;

      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      
      const payload = data?.data || data;
      const accessToken = payload?.accessToken;
      if (!accessToken) return null;

      useAuthStore.setState({
        accessToken,
        refreshToken: payload?.refreshToken || refreshToken,
      });
      
      return accessToken;
    } catch (e) {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response.data,
  async (error: any) => {
    const original = error?.config;
    const status = error?.response?.status;

    if (status === 401 && original && !original._retried) {
      original._retried = true;
      const newToken = await attemptRefresh();

      if (newToken) {
        original.headers = original.headers || {};
        original.headers['Authorization'] = `Bearer ${newToken}`;
        try { 
          return await api.request(original); 
        } catch (err) { 
          return Promise.reject(err); 
        }
      }
    }

    if (status === 401) {
      try { 
        const { useAuthStore } = require('../stores/auth-store');
        useAuthStore.getState().logout(); 
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default api;
