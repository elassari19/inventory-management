import { useQuery, useMutation } from '@apollo/client';
import { useToast } from '../components/ui/ToastProvider';
import {
  GET_USERS,
  GET_TENANTS,
  GET_DASHBOARD_METRICS,
  GET_INVENTORY,
  GET_REPORTS,
  GET_AUDIT_LOGS,
  CREATE_USER,
  UPDATE_USER,
  CREATE_TENANT,
  UPDATE_TENANT,
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
} from './graphql/queries';

// Custom hook for handling common query operations
export function useAppQuery<T = any>(query: any, options: any = {}) {
  const { toast } = useToast();

  const result = useQuery<T>(query, {
    ...options,
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

// Custom hook for handling mutations with automatic error handling
export function useAppMutation<T = any>(mutation: any, options: any = {}) {
  const { toast } = useToast();

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

  return [mutateFunction, result] as const;
}

// Specific hooks for common operations
export function useUsers(filters = {}, pagination = { page: 1, limit: 10 }) {
  return useAppQuery(GET_USERS, {
    variables: { filters, pagination },
    notifyOnNetworkStatusChange: true,
  });
}

export function useTenants(filters = {}, pagination = { page: 1, limit: 10 }) {
  return useAppQuery(GET_TENANTS, {
    variables: { filters, pagination },
    notifyOnNetworkStatusChange: true,
  });
}

export function useDashboardMetrics() {
  return useAppQuery(GET_DASHBOARD_METRICS, {
    pollInterval: 30000, // Poll every 30 seconds
  });
}

export function useInventory(
  filters = {},
  pagination = { page: 1, limit: 10 }
) {
  return useAppQuery(GET_INVENTORY, {
    variables: { filters, pagination },
    notifyOnNetworkStatusChange: true,
  });
}

export function useReports(filters = {}, pagination = { page: 1, limit: 10 }) {
  return useAppQuery(GET_REPORTS, {
    variables: { filters, pagination },
    notifyOnNetworkStatusChange: true,
  });
}

export function useAuditLogs(
  filters = {},
  pagination = { page: 1, limit: 10 }
) {
  return useAppQuery(GET_AUDIT_LOGS, {
    variables: { filters, pagination },
    notifyOnNetworkStatusChange: true,
  });
}

// Mutation hooks
export function useCreateUser() {
  return useAppMutation(CREATE_USER, {
    successMessage: 'User created successfully',
    refetchQueries: [{ query: GET_USERS }],
  });
}

export function useUpdateUser() {
  return useAppMutation(UPDATE_USER, {
    successMessage: 'User updated successfully',
    refetchQueries: [{ query: GET_USERS }],
  });
}

export function useCreateTenant() {
  return useAppMutation(CREATE_TENANT, {
    successMessage: 'Tenant created successfully',
    refetchQueries: [{ query: GET_TENANTS }],
  });
}

export function useUpdateTenant() {
  return useAppMutation(UPDATE_TENANT, {
    successMessage: 'Tenant updated successfully',
    refetchQueries: [{ query: GET_TENANTS }],
  });
}

export function useLogin() {
  return useAppMutation(LOGIN_MUTATION, {
    successMessage: 'Login successful',
  });
}

export function useLogout() {
  return useAppMutation(LOGOUT_MUTATION);
}

// Real-time subscription hooks (for future implementation)
export function useRealTimeUpdates() {
  // Placeholder for real-time subscriptions
  // This would implement WebSocket connections for live updates
  return {
    isConnected: true,
    lastUpdate: new Date(),
  };
}
