import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useToast } from '../components/ui/ToastProvider';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  // Authentication
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  SELECT_TENANT_MUTATION,
  LOGOUT_MUTATION,

  // Products
  GET_PRODUCTS,
  GET_PRODUCT,
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,

  // Categories
  GET_CATEGORIES,
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,

  // Brands
  GET_BRANDS,
  CREATE_BRAND,
  UPDATE_BRAND,
  DELETE_BRAND,

  // Locations
  GET_LOCATIONS,
  CREATE_LOCATION,
  UPDATE_LOCATION,
  DELETE_LOCATION,

  // Inventory
  GET_INVENTORY,
  UPDATE_INVENTORY,

  // Transactions
  GET_TRANSACTIONS,
  CREATE_TRANSACTION,

  // Analytics
  GET_ANALYTICS_OVERVIEW,
  GET_STOCK_ALERTS,
  RESOLVE_STOCK_ALERT,

  // Barcode
  SCAN_BARCODE,

  // Subscriptions
  INVENTORY_UPDATED_SUBSCRIPTION,
  TRANSACTION_CREATED_SUBSCRIPTION,
  STOCK_ALERT_CREATED_SUBSCRIPTION,
} from './graphql/queries';

// Custom hook for handling common query operations with tenant context
export function useAppQuery<T = any>(query: any, options: any = {}) {
  const { toast } = useToast();
  const currentTenant = useSelector(
    (state: RootState) => state.tenant.currentTenant
  );

  const result = useQuery<T>(query, {
    ...options,
    variables: {
      tenantId: currentTenant?.id,
      ...options.variables,
    },
    onError: (error) => {
      console.error('GraphQL Query Error:', error);
      toast({
        title: 'Query Error',
        description: error.message,
        type: 'error',
      });
      options.onError?.(error);
    },
  });

  return result;
}

// Custom hook for handling mutations with automatic error handling and tenant context
export function useAppMutation<T = any>(mutation: any, options: any = {}) {
  const { toast } = useToast();
  const currentTenant = useSelector(
    (state: RootState) => state.tenant.currentTenant
  );

  const [mutateFunction, result] = useMutation<T>(mutation, {
    ...options,
    onError: (error) => {
      console.error('GraphQL Mutation Error:', error);
      toast({
        title: 'Operation Failed',
        description: error.message,
        type: 'error',
      });
      options.onError?.(error);
    },
    onCompleted: (data) => {
      if (options.successMessage) {
        toast({
          title: 'Success',
          description: options.successMessage,
          type: 'success',
        });
      }
      options.onCompleted?.(data);
    },
  });

  // Wrap the mutate function to automatically include tenantId
  const wrappedMutateFunction = (variables: any = {}) => {
    return mutateFunction({
      variables: {
        tenantId: currentTenant?.id,
        ...variables,
      },
    });
  };

  return [wrappedMutateFunction, result] as const;
}

// Custom hook for subscriptions with tenant context
export function useAppSubscription<T = any>(
  subscription: any,
  options: any = {}
) {
  const currentTenant = useSelector(
    (state: RootState) => state.tenant.currentTenant
  );

  const result = useSubscription<T>(subscription, {
    ...options,
    variables: {
      tenantId: currentTenant?.id,
      ...options.variables,
    },
  });

  return result;
}

// Product hooks
export function useProducts(
  search?: string,
  categoryId?: string,
  brandId?: string,
  limit = 20,
  offset = 0
) {
  return useAppQuery(GET_PRODUCTS, {
    variables: { search, categoryId, brandId, limit, offset },
    notifyOnNetworkStatusChange: true,
  });
}

export function useProduct(id: string) {
  return useAppQuery(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });
}

export function useCreateProduct() {
  return useAppMutation(CREATE_PRODUCT, {
    successMessage: 'Product created successfully',
    refetchQueries: [{ query: GET_PRODUCTS }],
  });
}

export function useUpdateProduct() {
  return useAppMutation(UPDATE_PRODUCT, {
    successMessage: 'Product updated successfully',
  });
}

export function useDeleteProduct() {
  return useAppMutation(DELETE_PRODUCT, {
    successMessage: 'Product deleted successfully',
    refetchQueries: [{ query: GET_PRODUCTS }],
  });
}

// Category hooks
export function useCategories(search?: string, limit = 20, offset = 0) {
  return useAppQuery(GET_CATEGORIES, {
    variables: { search, limit, offset },
    notifyOnNetworkStatusChange: true,
  });
}

export function useCreateCategory() {
  return useAppMutation(CREATE_CATEGORY, {
    successMessage: 'Category created successfully',
    refetchQueries: [{ query: GET_CATEGORIES }],
  });
}

export function useUpdateCategory() {
  return useAppMutation(UPDATE_CATEGORY, {
    successMessage: 'Category updated successfully',
  });
}

export function useDeleteCategory() {
  return useAppMutation(DELETE_CATEGORY, {
    successMessage: 'Category deleted successfully',
    refetchQueries: [{ query: GET_CATEGORIES }],
  });
}

// Brand hooks
export function useBrands(search?: string, limit = 20, offset = 0) {
  return useAppQuery(GET_BRANDS, {
    variables: { search, limit, offset },
    notifyOnNetworkStatusChange: true,
  });
}

export function useCreateBrand() {
  return useAppMutation(CREATE_BRAND, {
    successMessage: 'Brand created successfully',
    refetchQueries: [{ query: GET_BRANDS }],
  });
}

export function useUpdateBrand() {
  return useAppMutation(UPDATE_BRAND, {
    successMessage: 'Brand updated successfully',
  });
}

export function useDeleteBrand() {
  return useAppMutation(DELETE_BRAND, {
    successMessage: 'Brand deleted successfully',
    refetchQueries: [{ query: GET_BRANDS }],
  });
}

// Location hooks
export function useLocations(search?: string, limit = 20, offset = 0) {
  return useAppQuery(GET_LOCATIONS, {
    variables: { search, limit, offset },
    notifyOnNetworkStatusChange: true,
  });
}

export function useCreateLocation() {
  return useAppMutation(CREATE_LOCATION, {
    successMessage: 'Location created successfully',
    refetchQueries: [{ query: GET_LOCATIONS }],
  });
}

export function useUpdateLocation() {
  return useAppMutation(UPDATE_LOCATION, {
    successMessage: 'Location updated successfully',
  });
}

export function useDeleteLocation() {
  return useAppMutation(DELETE_LOCATION, {
    successMessage: 'Location deleted successfully',
    refetchQueries: [{ query: GET_LOCATIONS }],
  });
}

// Inventory hooks
export function useInventory(
  locationId?: string,
  productId?: string,
  limit = 20,
  offset = 0
) {
  return useAppQuery(GET_INVENTORY, {
    variables: { locationId, productId, limit, offset },
    notifyOnNetworkStatusChange: true,
  });
}

export function useUpdateInventory() {
  return useAppMutation(UPDATE_INVENTORY, {
    successMessage: 'Inventory updated successfully',
    refetchQueries: [{ query: GET_INVENTORY }],
  });
}

// Transaction hooks
export function useTransactions(
  type?: string,
  locationId?: string,
  productId?: string,
  limit = 20,
  offset = 0
) {
  return useAppQuery(GET_TRANSACTIONS, {
    variables: { type, locationId, productId, limit, offset },
    notifyOnNetworkStatusChange: true,
  });
}

export function useCreateTransaction() {
  return useAppMutation(CREATE_TRANSACTION, {
    successMessage: 'Transaction created successfully',
    refetchQueries: [{ query: GET_TRANSACTIONS }, { query: GET_INVENTORY }],
  });
}

// Analytics hooks
export function useAnalyticsOverview(locationId?: string, dateRange?: any) {
  return useAppQuery(GET_ANALYTICS_OVERVIEW, {
    variables: { locationId, dateRange },
    pollInterval: 60000, // Poll every minute
  });
}

export function useStockAlerts(
  locationId?: string,
  type?: string,
  limit = 20,
  offset = 0
) {
  return useAppQuery(GET_STOCK_ALERTS, {
    variables: { locationId, type, limit, offset },
    notifyOnNetworkStatusChange: true,
  });
}

export function useResolveStockAlert() {
  return useAppMutation(RESOLVE_STOCK_ALERT, {
    successMessage: 'Alert resolved successfully',
    refetchQueries: [{ query: GET_STOCK_ALERTS }],
  });
}

// Barcode scanning hook
export function useScanBarcode() {
  return useAppMutation(SCAN_BARCODE, {
    successMessage: 'Barcode scanned successfully',
  });
}

// Authentication hooks
export function useLogin() {
  return useAppMutation(LOGIN_MUTATION, {
    successMessage: 'Login successful',
  });
}

export function useRegister() {
  return useAppMutation(REGISTER_MUTATION, {
    successMessage: 'Registration successful',
  });
}

export function useSelectTenant() {
  return useAppMutation(SELECT_TENANT_MUTATION, {
    successMessage: 'Tenant selected successfully',
  });
}

export function useLogout() {
  return useAppMutation(LOGOUT_MUTATION);
}

// Real-time subscription hooks
export function useInventoryUpdates(locationId?: string) {
  return useAppSubscription(INVENTORY_UPDATED_SUBSCRIPTION, {
    variables: { locationId },
  });
}

export function useTransactionUpdates(locationId?: string) {
  return useAppSubscription(TRANSACTION_CREATED_SUBSCRIPTION, {
    variables: { locationId },
  });
}

export function useStockAlertUpdates(locationId?: string) {
  return useAppSubscription(STOCK_ALERT_CREATED_SUBSCRIPTION, {
    variables: { locationId },
  });
}
