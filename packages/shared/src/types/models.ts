export interface UserPayload {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  isSuperAdmin: boolean;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  customDomain?: string;
  isActive: boolean;
  planId?: string;
  planName?: string;
  settings?: Record<string, unknown>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}
