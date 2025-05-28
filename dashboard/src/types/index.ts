export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  permissions: string[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: TenantPlan;
  createdAt: string;
  updatedAt: string;
  settings: TenantSettings;
  usage: TenantUsage;
  limits: TenantLimits;
  domain?: string;
  logo?: string;
  contactEmail: string;
}

export const TenantStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const;

export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const TenantPlan = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
  CUSTOM: 'custom',
} as const;

export type TenantPlan = (typeof TenantPlan)[keyof typeof TenantPlan];

export interface TenantSettings {
  timezone: string;
  currency: string;
  language: string;
  features: {
    analytics: boolean;
    reporting: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    multiLocation: boolean;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    webhook: boolean;
  };
  security: {
    twoFactorRequired: boolean;
    passwordPolicy: PasswordPolicy;
    sessionTimeout: number;
  };
}

export interface TenantUsage {
  users: number;
  storage: number; // in bytes
  apiCalls: number;
  locations: number;
  products: number;
}

export interface TenantLimits {
  maxUsers: number;
  maxStorage: number; // in bytes
  maxApiCalls: number;
  maxLocations: number;
  maxProducts: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unitPrice: number;
  costPrice?: number;
  currency: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  images: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export const ProductStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCONTINUED: 'discontinued',
  DRAFT: 'draft',
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  address: Address;
  contactInfo: ContactInfo;
  status: LocationStatus;
  settings: LocationSettings;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export const LocationType = {
  WAREHOUSE: 'warehouse',
  STORE: 'store',
  DISTRIBUTION_CENTER: 'distribution_center',
  SUPPLIER: 'supplier',
  CUSTOMER: 'customer',
} as const;

export type LocationType = (typeof LocationType)[keyof typeof LocationType];

export const LocationStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
} as const;

export type LocationStatus =
  (typeof LocationStatus)[keyof typeof LocationStatus];

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  contactPerson?: string;
}

export interface LocationSettings {
  timezone: string;
  businessHours: BusinessHours[];
  autoReorderEnabled: boolean;
  lowStockThreshold: number;
}

export interface BusinessHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
  isClosed: boolean;
}

export interface Inventory {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  maxStock: number;
  lastCountedAt?: string;
  lastMovementAt?: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export interface InventoryMovement {
  id: string;
  inventoryId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  reference?: string;
  performedBy: string;
  createdAt: string;
  tenantId: string;
}

export const MovementType = {
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
  SALE: 'sale',
  PURCHASE: 'purchase',
  RETURN: 'return',
  DAMAGE: 'damage',
  LOSS: 'loss',
  COUNT: 'count',
} as const;

export type MovementType = (typeof MovementType)[keyof typeof MovementType];

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  config: ReportConfig;
  schedule?: ReportSchedule;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export const ReportType = {
  INVENTORY_SUMMARY: 'inventory_summary',
  STOCK_MOVEMENT: 'stock_movement',
  LOW_STOCK: 'low_stock',
  VALUATION: 'valuation',
  TURNOVER: 'turnover',
  VARIANCE: 'variance',
  CUSTOM: 'custom',
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export interface ReportConfig {
  dateRange: {
    start: string;
    end: string;
  };
  filters: Record<string, any>;
  groupBy?: string[];
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  includeCharts: boolean;
  format: 'pdf' | 'excel' | 'csv';
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:mm format
  recipients: string[];
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  userEmail: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  tenantId: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalProducts: number;
  totalLocations: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  usage: {
    storage: {
      used: number;
      total: number;
      percentage: number;
    };
    apiCalls: {
      count: number;
      limit: number;
      percentage: number;
    };
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: {
    system: boolean;
    inventory: boolean;
    users: boolean;
    reports: boolean;
    security: boolean;
  };
}
