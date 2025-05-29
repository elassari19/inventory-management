import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useToast } from '../components/ui/ToastProvider';
import {
  GET_BILLING_INFO,
  GET_SUBSCRIPTION_PLANS,
  GET_CURRENT_SUBSCRIPTION,
  GET_SUBSCRIPTION_USAGE,
  GET_PAYMENT_METHODS,
  GET_INVOICES,
  GET_INVOICE,
  GET_TRANSACTIONS,
  CHECK_SUBSCRIPTION_LIMIT,
  CREATE_SUBSCRIPTION,
  CHANGE_SUBSCRIPTION_PLAN,
  CANCEL_SUBSCRIPTION,
  RESUME_SUBSCRIPTION,
  ADD_PAYMENT_METHOD,
  SET_DEFAULT_PAYMENT_METHOD,
  REMOVE_PAYMENT_METHOD,
  CREATE_INVOICE,
  PROCESS_PAYMENT,
  RETRY_PAYMENT,
  TRACK_USAGE,
  SUBSCRIPTION_UPDATED,
  INVOICE_CREATED,
  PAYMENT_PROCESSED,
  USAGE_UPDATED,
} from '../services/graphql/billing';

// Types for better TypeScript support
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  features: any;
  limits: any;
  active: boolean;
  trialDays: number;
  sortOrder: number;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt?: string;
  paymentMethodId?: string;
  externalSubscriptionId?: string;
  isInTrial: boolean;
  daysUntilRenewal?: number;
}

export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: 'CARD' | 'BANK_ACCOUNT' | 'PAYPAL';
  details: any;
  isDefault: boolean;
  expiryDate?: string;
  lastFour?: string;
  brand?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  subscriptionId?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'FAILED' | 'VOID' | 'REFUNDED';
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
  billingDetails: any;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  invoiceId?: string;
  invoice?: Invoice;
  amount: number;
  currency: string;
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'REFUNDED'
    | 'CANCELED';
  paymentMethod?: string;
  gatewayProvider: string;
  gatewayTransactionId?: string;
  failureReason?: string;
  createdAt: string;
}

export interface SubscriptionUsage {
  id: string;
  tenantId: string;
  subscriptionId: string;
  usageType: 'API_CALLS' | 'STORAGE' | 'USERS' | 'LOCATIONS' | 'PRODUCTS';
  usageCount: number;
  usagePeriodStart: string;
  usagePeriodEnd: string;
  limitValue?: number;
  percentageUsed?: number;
}

export interface UsageSummary {
  products?: SubscriptionUsage;
  locations?: SubscriptionUsage;
  users?: SubscriptionUsage;
  apiCalls?: SubscriptionUsage;
  storage?: SubscriptionUsage;
}

export interface BillingInfo {
  subscription?: TenantSubscription;
  paymentMethods: PaymentMethod[];
  recentInvoices: Invoice[];
  recentTransactions: PaymentTransaction[];
  usage?: UsageSummary;
}

// Query Hooks
export const useBillingInfo = () => {
  return useQuery<{ billingInfo: BillingInfo }>(GET_BILLING_INFO, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });
};

export const useSubscriptionPlans = (activeOnly: boolean = true) => {
  return useQuery<{ subscriptionPlans: SubscriptionPlan[] }>(
    GET_SUBSCRIPTION_PLANS,
    {
      variables: { activeOnly },
      errorPolicy: 'all',
    }
  );
};

export const useCurrentSubscription = () => {
  return useQuery<{ currentSubscription: TenantSubscription }>(
    GET_CURRENT_SUBSCRIPTION,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    }
  );
};

export const useSubscriptionUsage = () => {
  return useQuery<{ subscriptionUsage: UsageSummary }>(GET_SUBSCRIPTION_USAGE, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });
};

export const usePaymentMethods = () => {
  return useQuery<{ paymentMethods: PaymentMethod[] }>(GET_PAYMENT_METHODS, {
    errorPolicy: 'all',
  });
};

export const useInvoices = (limit: number = 50) => {
  return useQuery<{ invoices: Invoice[] }>(GET_INVOICES, {
    variables: { limit },
    errorPolicy: 'all',
  });
};

export const useInvoice = (id: string) => {
  return useQuery<{ invoice: Invoice }>(GET_INVOICE, {
    variables: { id },
    errorPolicy: 'all',
    skip: !id,
  });
};

export const useTransactions = (limit: number = 50) => {
  return useQuery<{ transactions: PaymentTransaction[] }>(GET_TRANSACTIONS, {
    variables: { limit },
    errorPolicy: 'all',
  });
};

export const useCheckSubscriptionLimit = (
  limitType: string,
  currentUsage: number = 1
) => {
  return useQuery<{ checkSubscriptionLimit: boolean }>(
    CHECK_SUBSCRIPTION_LIMIT,
    {
      variables: { limitType, currentUsage },
      errorPolicy: 'all',
      skip: !limitType,
    }
  );
};

// Mutation Hooks
export const useCreateSubscription = () => {
  const { toast } = useToast();

  return useMutation(CREATE_SUBSCRIPTION, {
    onCompleted: (data) => {
      toast({
        title: 'Subscription Created',
        description: `Successfully created subscription for ${data.createSubscription.plan?.name} plan`,
        type: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Subscription Creation Failed',
        description: error.message,
        type: 'error',
      });
    },
    refetchQueries: [GET_BILLING_INFO, GET_CURRENT_SUBSCRIPTION],
  });
};

export const useChangeSubscriptionPlan = () => {
  const { toast } = useToast();

  return useMutation(CHANGE_SUBSCRIPTION_PLAN, {
    onCompleted: (data) => {
      toast({
        title: 'Plan Changed',
        description: `Successfully changed to ${data.changeSubscriptionPlan.plan?.name} plan`,
        type: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Plan Change Failed',
        description: error.message,
        type: 'error',
      });
    },
    refetchQueries: [
      GET_BILLING_INFO,
      GET_CURRENT_SUBSCRIPTION,
      GET_SUBSCRIPTION_USAGE,
    ],
  });
};

export const useCancelSubscription = () => {
  const { toast } = useToast();

  return useMutation(CANCEL_SUBSCRIPTION, {
    onCompleted: (data) => {
      toast({
        title: 'Subscription Canceled',
        description: data.cancelSubscription.canceledAt
          ? 'Subscription canceled immediately'
          : 'Subscription will be canceled at the end of the current period',
        type: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message,
        type: 'error',
      });
    },
    refetchQueries: [GET_BILLING_INFO, GET_CURRENT_SUBSCRIPTION],
  });
};

export const useResumeSubscription = () => {
  const { toast } = useToast();

  return useMutation(RESUME_SUBSCRIPTION, {
    onCompleted: () => {
      toast({
        title: 'Subscription Resumed',
        description: 'Your subscription has been successfully resumed',
        type: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Resume Failed',
        description: error.message,
        type: 'error',
      });
    },
    refetchQueries: [GET_BILLING_INFO, GET_CURRENT_SUBSCRIPTION],
  });
};

export const useAddPaymentMethod = () => {
  const { toast } = useToast();

  return useMutation(ADD_PAYMENT_METHOD, {
    onCompleted: () => {
      toast({
        title: 'Payment Method Added',
        description: 'Payment method has been successfully added',
        type: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add Payment Method',
        description: error.message,
        type: 'error',
      });
    },
    refetchQueries: [GET_BILLING_INFO, GET_PAYMENT_METHODS],
  });
};

export const useSetDefaultPaymentMethod = () => {
  const { toast } = useToast();

  return useMutation(SET_DEFAULT_PAYMENT_METHOD, {
    onCompleted: () => {
      toast({
        title: 'Default Payment Method Updated',
        description: 'Default payment method has been updated',
        type: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        type: 'error',
      });
    },
    refetchQueries: [GET_BILLING_INFO, GET_PAYMENT_METHODS],
  });
};

export const useRemovePaymentMethod = () => {
  const { toast } = useToast();

  return useMutation(REMOVE_PAYMENT_METHOD, {
    onCompleted: () => {
      toast({
        title: 'Payment Method Removed',
        description: 'Payment method has been successfully removed',
        type: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Removal Failed',
        description: error.message,
        type: 'error',
      });
    },
    refetchQueries: [GET_BILLING_INFO, GET_PAYMENT_METHODS],
  });
};

export const useCreateInvoice = () => {
  const { toast } = useToast();

  return useMutation(CREATE_INVOICE, {
    onCompleted: (data) => {
      toast({
        title: 'Invoice Created',
        description: `Invoice ${data.createInvoice.invoiceNumber} has been created`,
        type: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Invoice Creation Failed',
        description: error.message,
        type: 'error',
      });
    },
    refetchQueries: [GET_BILLING_INFO, GET_INVOICES],
  });
};

export const useProcessPayment = () => {
  const { toast } = useToast();

  return useMutation(PROCESS_PAYMENT, {
    onCompleted: (data) => {
      toast({
        title: 'Payment Processed',
        description:
          data.processPayment.status === 'SUCCEEDED'
            ? 'Payment has been successfully processed'
            : 'Payment is being processed',
        type:
          data.processPayment.status === 'SUCCEEDED' ? 'success' : 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Payment Failed',
        description: error.message,
        type: 'error',
      });
    },
    refetchQueries: [GET_BILLING_INFO, GET_INVOICES, GET_TRANSACTIONS],
  });
};

export const useRetryPayment = () => {
  const { toast } = useToast();

  return useMutation(RETRY_PAYMENT, {
    onCompleted: () => {
      toast({
        title: 'Payment Retry Initiated',
        description: 'Payment retry has been initiated',
        type: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Payment Retry Failed',
        description: error.message,
        type: 'error',
      });
    },
    refetchQueries: [GET_BILLING_INFO, GET_TRANSACTIONS],
  });
};

export const useTrackUsage = () => {
  return useMutation(TRACK_USAGE, {
    refetchQueries: [GET_SUBSCRIPTION_USAGE, GET_BILLING_INFO],
  });
};

// Subscription Hooks (WebSocket)
export const useSubscriptionUpdates = (tenantId: string) => {
  return useSubscription(SUBSCRIPTION_UPDATED, {
    variables: { tenantId },
    skip: !tenantId,
  });
};

export const useInvoiceUpdates = (tenantId: string) => {
  const { toast } = useToast();

  return useSubscription(INVOICE_CREATED, {
    variables: { tenantId },
    skip: !tenantId,
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.invoiceCreated) {
        const invoice = subscriptionData.data.invoiceCreated;
        toast({
          title: 'New Invoice',
          description: `Invoice ${invoice.invoiceNumber} has been created`,
          type: 'default',
        });
      }
    },
  });
};

export const usePaymentUpdates = (tenantId: string) => {
  const { toast } = useToast();

  return useSubscription(PAYMENT_PROCESSED, {
    variables: { tenantId },
    skip: !tenantId,
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.paymentProcessed) {
        const payment = subscriptionData.data.paymentProcessed;
        toast({
          title: 'Payment Update',
          description:
            payment.status === 'SUCCEEDED'
              ? 'Payment has been successfully processed'
              : `Payment status: ${payment.status}`,
          type:
            payment.status === 'SUCCEEDED'
              ? 'success'
              : payment.status === 'FAILED'
              ? 'error'
              : 'default',
        });
      }
    },
  });
};

export const useUsageUpdates = (tenantId: string) => {
  return useSubscription(USAGE_UPDATED, {
    variables: { tenantId },
    skip: !tenantId,
  });
};
