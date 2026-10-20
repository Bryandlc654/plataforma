const DEFAULT_API_URL = "https://plataforma-api-rkav7vkxia-uc.a.run.app/api/v1";

const RETIRED_API_HOSTS = [
  "plataforma-api-71743315793",
  "plataforma-api-j6ey.onrender.com",
];

export function resolveApiBaseUrl(value?: string | null): string {
  const configured = (value || "").trim();
  if (!configured) return DEFAULT_API_URL;
  if (RETIRED_API_HOSTS.some((host) => configured.includes(host))) return DEFAULT_API_URL;
  return configured;
}

export const API_BASE_URL = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
