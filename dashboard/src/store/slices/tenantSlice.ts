import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  settings: Record<string, any>;
  usage: {
    users: number;
    storage: number;
    apiCalls: number;
  };
  limits: {
    maxUsers: number;
    maxStorage: number;
    maxApiCalls: number;
  };
}

interface TenantState {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: string;
    plan?: string;
    search?: string;
  };
}

const initialState: TenantState = {
  tenants: [],
  currentTenant: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    fetchTenantsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchTenantsSuccess: (
      state,
      action: PayloadAction<{
        tenants: Tenant[];
        pagination: TenantState['pagination'];
      }>
    ) => {
      state.isLoading = false;
      state.tenants = action.payload.tenants;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    fetchTenantsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setCurrentTenant: (state, action: PayloadAction<Tenant>) => {
      state.currentTenant = action.payload;
    },
    updateTenant: (state, action: PayloadAction<Tenant>) => {
      const index = state.tenants.findIndex(
        (tenant) => tenant.id === action.payload.id
      );
      if (index !== -1) {
        state.tenants[index] = action.payload;
      }
      if (state.currentTenant?.id === action.payload.id) {
        state.currentTenant = action.payload;
      }
    },
    addTenant: (state, action: PayloadAction<Tenant>) => {
      state.tenants.unshift(action.payload);
    },
    removeTenant: (state, action: PayloadAction<string>) => {
      state.tenants = state.tenants.filter(
        (tenant) => tenant.id !== action.payload
      );
      if (state.currentTenant?.id === action.payload) {
        state.currentTenant = null;
      }
    },
    setFilters: (state, action: PayloadAction<TenantState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (
      state,
      action: PayloadAction<Partial<TenantState['pagination']>>
    ) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
});

export const {
  fetchTenantsStart,
  fetchTenantsSuccess,
  fetchTenantsFailure,
  setCurrentTenant,
  updateTenant,
  addTenant,
  removeTenant,
  setFilters,
  clearFilters,
  setPagination,
} = tenantSlice.actions;

export default tenantSlice.reducer;
