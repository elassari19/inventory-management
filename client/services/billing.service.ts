import { useQuery, useMutation } from '@apollo/client';
import { Alert } from 'react-native';
import {
  GET_BILLING_INFO,
  GET_SUBSCRIPTION_PLANS,
  GET_CURRENT_SUBSCRIPTION,
  CHANGE_SUBSCRIPTION_PLAN,
  ADD_PAYMENT_METHOD,
  SET_DEFAULT_PAYMENT_METHOD,
  REMOVE_PAYMENT_METHOD,
  CANCEL_SUBSCRIPTION,
  RESUME_SUBSCRIPTION,
  DOWNLOAD_INVOICE,
} from '../graphql/billing';

// Custom hook for handling query errors
const useQueryWithErrorHandling = (query: any, options: any = {}) => {
  return useQuery(query, {
    ...options,
    onError: (error) => {
      console.error('GraphQL Query Error:', error);
      Alert.alert('Error', error.message);
      options.onError?.(error);
    },
  });
};

// Custom hook for handling mutation errors
const useMutationWithErrorHandling = (mutation: any, options: any = {}) => {
  return useMutation(mutation, {
    ...options,
    onError: (error) => {
      console.error('GraphQL Mutation Error:', error);
      Alert.alert('Error', error.message);
      options.onError?.(error);
    },
    onCompleted: (data) => {
      if (options.successMessage) {
        Alert.alert('Success', options.successMessage);
      }
      options.onCompleted?.(data);
    },
  });
};

// Billing Query Hooks
export function useBillingInfo() {
  return useQueryWithErrorHandling(GET_BILLING_INFO, {
    fetchPolicy: 'cache-and-network',
  });
}

export function useSubscriptionPlans() {
  return useQueryWithErrorHandling(GET_SUBSCRIPTION_PLANS, {
    fetchPolicy: 'cache-first',
  });
}

export function useCurrentSubscription() {
  return useQueryWithErrorHandling(GET_CURRENT_SUBSCRIPTION, {
    fetchPolicy: 'cache-and-network',
  });
}

// Billing Mutation Hooks
export function useChangeSubscriptionPlan() {
  return useMutationWithErrorHandling(CHANGE_SUBSCRIPTION_PLAN, {
    successMessage: 'Subscription plan changed successfully',
    refetchQueries: [
      { query: GET_BILLING_INFO },
      { query: GET_CURRENT_SUBSCRIPTION },
    ],
  });
}

export function useAddPaymentMethod() {
  return useMutationWithErrorHandling(ADD_PAYMENT_METHOD, {
    successMessage: 'Payment method added successfully',
    refetchQueries: [{ query: GET_BILLING_INFO }],
  });
}

export function useSetDefaultPaymentMethod() {
  return useMutationWithErrorHandling(SET_DEFAULT_PAYMENT_METHOD, {
    successMessage: 'Default payment method updated successfully',
    refetchQueries: [{ query: GET_BILLING_INFO }],
  });
}

export function useRemovePaymentMethod() {
  return useMutationWithErrorHandling(REMOVE_PAYMENT_METHOD, {
    successMessage: 'Payment method removed successfully',
    refetchQueries: [{ query: GET_BILLING_INFO }],
  });
}

export function useCancelSubscription() {
  return useMutationWithErrorHandling(CANCEL_SUBSCRIPTION, {
    successMessage: 'Subscription cancelled successfully',
    refetchQueries: [
      { query: GET_BILLING_INFO },
      { query: GET_CURRENT_SUBSCRIPTION },
    ],
  });
}

export function useResumeSubscription() {
  return useMutationWithErrorHandling(RESUME_SUBSCRIPTION, {
    successMessage: 'Subscription resumed successfully',
    refetchQueries: [
      { query: GET_BILLING_INFO },
      { query: GET_CURRENT_SUBSCRIPTION },
    ],
  });
}

export function useDownloadInvoice() {
  return useMutationWithErrorHandling(DOWNLOAD_INVOICE, {
    successMessage: 'Invoice downloaded successfully',
  });
}

// Utility functions for billing data
export const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return '#10b981'; // green
    case 'trial':
      return '#f59e0b'; // yellow
    case 'past_due':
      return '#ef4444'; // red
    case 'canceled':
      return '#6b7280'; // gray
    default:
      return '#6b7280'; // gray
  }
};

export const getUsageColor = (percentage: number) => {
  if (percentage >= 90) return '#ef4444'; // red
  if (percentage >= 75) return '#f59e0b'; // yellow
  return '#10b981'; // green
};

export const calculateUsagePercentage = (
  current: number,
  limit: number | string
) => {
  if (typeof limit === 'string' && limit.toLowerCase() === 'unlimited') {
    return 0;
  }

  const limitNumber =
    typeof limit === 'number' ? limit : parseInt(limit.toString());
  if (limitNumber === 0) return 0;

  return Math.min((current / limitNumber) * 100, 100);
};
