import { gql } from '@apollo/client';

// Billing Queries
export const GET_BILLING_INFO = gql`
  query GetBillingInfo {
    billingInfo {
      subscription {
        id
        tenantId
        planId
        plan {
          id
          name
          description
          price
          billingCycle
          features
          limits
          active
          trialDays
        }
        status
        startDate
        endDate
        trialEndDate
        currentPeriodStart
        currentPeriodEnd
        canceledAt
        paymentMethodId
        externalSubscriptionId
        isInTrial
        daysUntilRenewal
      }
      paymentMethods {
        id
        tenantId
        type
        details
        isDefault
        expiryDate
        lastFour
        brand
        createdAt
      }
      recentInvoices {
        id
        invoiceNumber
        tenantId
        subscriptionId
        amount
        taxAmount
        totalAmount
        currency
        status
        dueDate
        paidDate
        items {
          description
          quantity
          unitPrice
          amount
        }
        billingDetails
        createdAt
      }
      usage {
        products {
          id
          tenantId
          subscriptionId
          usageType
          usageCount
          usagePeriodStart
          usagePeriodEnd
          limitValue
          percentageUsed
        }
        locations {
          id
          tenantId
          subscriptionId
          usageType
          usageCount
          usagePeriodStart
          usagePeriodEnd
          limitValue
          percentageUsed
        }
        users {
          id
          tenantId
          subscriptionId
          usageType
          usageCount
          usagePeriodStart
          usagePeriodEnd
          limitValue
          percentageUsed
        }
        apiCalls {
          id
          tenantId
          subscriptionId
          usageType
          usageCount
          usagePeriodStart
          usagePeriodEnd
          limitValue
          percentageUsed
        }
        storage {
          id
          tenantId
          subscriptionId
          usageType
          usageCount
          usagePeriodStart
          usagePeriodEnd
          limitValue
          percentageUsed
        }
      }
    }
  }
`;

export const GET_SUBSCRIPTION_PLANS = gql`
  query GetSubscriptionPlans {
    subscriptionPlans {
      id
      name
      description
      price
      billingCycle
      features
      limits
      active
      trialDays
      sortOrder
    }
  }
`;

export const GET_CURRENT_SUBSCRIPTION = gql`
  query GetCurrentSubscription {
    currentSubscription {
      id
      tenantId
      planId
      plan {
        id
        name
        description
        price
        billingCycle
        features
        limits
        active
        trialDays
      }
      status
      startDate
      endDate
      trialEndDate
      currentPeriodStart
      currentPeriodEnd
      canceledAt
      paymentMethodId
      externalSubscriptionId
      isInTrial
      daysUntilRenewal
    }
  }
`;

// Billing Mutations
export const CHANGE_SUBSCRIPTION_PLAN = gql`
  mutation ChangeSubscriptionPlan($planId: ID!, $billingCycle: BillingCycle!) {
    changeSubscriptionPlan(planId: $planId, billingCycle: $billingCycle) {
      id
      planId
      plan {
        id
        name
        description
        price
        billingCycle
      }
      status
      currentPeriodStart
      currentPeriodEnd
    }
  }
`;

export const ADD_PAYMENT_METHOD = gql`
  mutation AddPaymentMethod($paymentMethodData: PaymentMethodInput!) {
    addPaymentMethod(paymentMethodData: $paymentMethodData) {
      id
      tenantId
      type
      details
      isDefault
      expiryDate
      lastFour
      brand
      createdAt
    }
  }
`;

export const SET_DEFAULT_PAYMENT_METHOD = gql`
  mutation SetDefaultPaymentMethod($paymentMethodId: ID!) {
    setDefaultPaymentMethod(paymentMethodId: $paymentMethodId) {
      id
      isDefault
    }
  }
`;

export const REMOVE_PAYMENT_METHOD = gql`
  mutation RemovePaymentMethod($paymentMethodId: ID!) {
    removePaymentMethod(paymentMethodId: $paymentMethodId)
  }
`;

export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription($cancelAtPeriodEnd: Boolean!) {
    cancelSubscription(cancelAtPeriodEnd: $cancelAtPeriodEnd) {
      id
      status
      canceledAt
    }
  }
`;

export const RESUME_SUBSCRIPTION = gql`
  mutation ResumeSubscription {
    resumeSubscription {
      id
      status
      canceledAt
    }
  }
`;

export const DOWNLOAD_INVOICE = gql`
  mutation DownloadInvoice($invoiceId: ID!) {
    downloadInvoice(invoiceId: $invoiceId)
  }
`;
