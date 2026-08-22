import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const tenantId = useAuthStore.getState().tenantId;
  if (tenantId) {
    config.headers["X-Tenant-Id"] = tenantId;
  }

  // Send stored access token as Bearer for API auth (cross-origin cookie fallback)
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Let the browser set the multipart boundary for FormData uploads
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else {
      delete config.headers["Content-Type"];
    }
  } else if (config.headers["Content-Type"] === "multipart/form-data") {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else {
      delete config.headers["Content-Type"];
    }
  }

  const method = (config.method || "get").toLowerCase();
  const unsafeMethods = new Set(["post", "put", "patch", "delete"]);
  if (unsafeMethods.has(method)) {
    const csrf = getCookie("csrf_token");
    if (csrf) {
      config.headers["X-CSRF-Token"] = csrf;
    }
  }

  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) return null;

      const { data }: any = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true }
      );

      const payload = data?.data || data;
      const accessToken = payload?.accessToken;
      if (!accessToken) return null;

      useAuthStore.setState({
        accessToken,
        refreshToken: payload?.refreshToken || refreshToken,
      });
      return accessToken;
    } catch {
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
        original.headers["Authorization"] = `Bearer ${newToken}`;
        try { return await api.request(original); }
        catch (err) { return Promise.reject(err); }
      }
    }

    if (status === 401) {
      const url = String(original?.url || "");
      const isAuthProbe = url.includes("/auth/me");
      try { if (!isAuthProbe) useAuthStore.getState().logout(); } catch {}
      const onAuthPage =
        typeof window !== "undefined" &&
        ["/login", "/register"].includes(window.location.pathname);
      if (typeof window !== "undefined" && !isAuthProbe && !onAuthPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
