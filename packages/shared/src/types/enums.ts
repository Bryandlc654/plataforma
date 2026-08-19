export enum RoleType {
  SUPER_ADMIN = "super_admin",
  SUPPORT = "support",
  OWNER = "owner",
  ADMIN = "admin",
  EDITOR = "editor",
  MARKETING = "marketing",
  BILLING = "billing",
  VIEWER = "viewer",
}

export enum PermissionAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
  PUBLISH = "publish",
}

export enum PermissionResource {
  SITE = "site",
  USER = "user",
  ROLE = "role",
  BILLING = "billing",
  SUBSCRIPTION = "subscription",
  ANALYTICS = "analytics",
  LEAD = "lead",
  INTEGRATION = "integration",
  CONFIG = "config",
  AUDIT = "audit",
}

export enum PlanType {
  FREE = "free",
  PRO = "pro",
  BUSINESS = "business",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  EXPIRED = "expired",
  SUSPENDED = "suspended",
}

export enum LeadStatus {
  NEW = "new",
  CONTACTED = "contacted",
  QUALIFIED = "qualified",
  CONVERTED = "converted",
  ARCHIVED = "archived",
}

export enum InvoiceStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}
