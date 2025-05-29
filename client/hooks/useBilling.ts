import { useQuery, useMutation } from '@apollo/client';
import {
  GET_BILLING_INFO,
  GET_SUBSCRIPTION_PLANS,
  GET_CURRENT_SUBSCRIPTION,
  ADD_PAYMENT_METHOD,
  SET_DEFAULT_PAYMENT_METHOD,
  REMOVE_PAYMENT_METHOD,
  CANCEL_SUBSCRIPTION,
  RESUME_SUBSCRIPTION,
} from '../graphql/billing';

// Types for better type safety
interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: string;
  features?: string[];
  limits?: any;
  active?: boolean;
  trialDays?: number;
  sortOrder?: number;
}

interface BillingInfo {
  subscription?: any;
  paymentMethods?: any[];
  recentInvoices?: any[];
  usage?: any;
}

// Billing info hook
export function useBillingInfo() {
  return useQuery<{ billingInfo: BillingInfo }>(GET_BILLING_INFO, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
}

// Subscription plans hook
export function useSubscriptionPlans() {
  return useQuery<{ subscriptionPlans: Plan[] }>(GET_SUBSCRIPTION_PLANS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
}

// Current subscription hook
export function useCurrentSubscription() {
  return useQuery(GET_CURRENT_SUBSCRIPTION, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
}

// Change subscription plan hook
export function useChangeSubscriptionPlan() {
  return useMutation(ADD_PAYMENT_METHOD, {
    refetchQueries: [{ query: GET_BILLING_INFO }],
    errorPolicy: 'all',
  });
}

// Add payment method hook
export function useAddPaymentMethod() {
  return useMutation(ADD_PAYMENT_METHOD, {
    refetchQueries: [{ query: GET_BILLING_INFO }],
    errorPolicy: 'all',
  });
}

// Set default payment method hook
export function useSetDefaultPaymentMethod() {
  return useMutation(SET_DEFAULT_PAYMENT_METHOD, {
    refetchQueries: [{ query: GET_BILLING_INFO }],
    errorPolicy: 'all',
  });
}

// Remove payment method hook
export function useRemovePaymentMethod() {
  return useMutation(REMOVE_PAYMENT_METHOD, {
    refetchQueries: [{ query: GET_BILLING_INFO }],
    errorPolicy: 'all',
  });
}

// Cancel subscription hook
export function useCancelSubscription() {
  return useMutation(CANCEL_SUBSCRIPTION, {
    refetchQueries: [{ query: GET_BILLING_INFO }],
    errorPolicy: 'all',
  });
}

// Resume subscription hook
export function useResumeSubscription() {
  return useMutation(RESUME_SUBSCRIPTION, {
    refetchQueries: [{ query: GET_BILLING_INFO }],
    errorPolicy: 'all',
  });
}
