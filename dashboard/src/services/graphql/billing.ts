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
      recentTransactions {
        id
        tenantId
        invoiceId
        amount
        currency
        status
        paymentMethod
        gatewayProvider
        gatewayTransactionId
        failureReason
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
  query GetSubscriptionPlans($activeOnly: Boolean = true) {
    subscriptionPlans(activeOnly: $activeOnly) {
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

export const GET_SUBSCRIPTION_USAGE = gql`
  query GetSubscriptionUsage {
    subscriptionUsage {
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
`;

export const GET_PAYMENT_METHODS = gql`
  query GetPaymentMethods {
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
  }
`;

export const GET_INVOICES = gql`
  query GetInvoices($limit: Int = 50) {
    invoices(limit: $limit) {
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
  }
`;

export const GET_INVOICE = gql`
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
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
  }
`;

export const GET_TRANSACTIONS = gql`
  query GetTransactions($limit: Int = 50) {
    transactions(limit: $limit) {
      id
      tenantId
      invoiceId
      invoice {
        id
        invoiceNumber
        amount
        status
        dueDate
      }
      amount
      currency
      status
      paymentMethod
      gatewayProvider
      gatewayTransactionId
      failureReason
      createdAt
    }
  }
`;

export const CHECK_SUBSCRIPTION_LIMIT = gql`
  query CheckSubscriptionLimit($limitType: String!, $currentUsage: Int = 1) {
    checkSubscriptionLimit(limitType: $limitType, currentUsage: $currentUsage)
  }
`;

// Billing Mutations
export const CREATE_SUBSCRIPTION = gql`
  mutation CreateSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
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

export const CHANGE_SUBSCRIPTION_PLAN = gql`
  mutation ChangeSubscriptionPlan($input: ChangeSubscriptionPlanInput!) {
    changeSubscriptionPlan(input: $input) {
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

export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription($immediate: Boolean = false) {
    cancelSubscription(immediate: $immediate) {
      id
      tenantId
      planId
      plan {
        id
        name
        description
        price
        billingCycle
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

export const RESUME_SUBSCRIPTION = gql`
  mutation ResumeSubscription {
    resumeSubscription {
      id
      tenantId
      planId
      plan {
        id
        name
        description
        price
        billingCycle
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

export const ADD_PAYMENT_METHOD = gql`
  mutation AddPaymentMethod($input: AddPaymentMethodInput!) {
    addPaymentMethod(input: $input) {
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

export const REMOVE_PAYMENT_METHOD = gql`
  mutation RemovePaymentMethod($paymentMethodId: ID!) {
    removePaymentMethod(paymentMethodId: $paymentMethodId)
  }
`;

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
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
  }
`;

export const PROCESS_PAYMENT = gql`
  mutation ProcessPayment($invoiceId: ID!, $paymentMethodId: ID!) {
    processPayment(invoiceId: $invoiceId, paymentMethodId: $paymentMethodId) {
      id
      tenantId
      invoiceId
      invoice {
        id
        invoiceNumber
        amount
        status
      }
      amount
      currency
      status
      paymentMethod
      gatewayProvider
      gatewayTransactionId
      failureReason
      createdAt
    }
  }
`;

export const RETRY_PAYMENT = gql`
  mutation RetryPayment($transactionId: ID!) {
    retryPayment(transactionId: $transactionId) {
      id
      tenantId
      invoiceId
      invoice {
        id
        invoiceNumber
        amount
        status
      }
      amount
      currency
      status
      paymentMethod
      gatewayProvider
      gatewayTransactionId
      failureReason
      createdAt
    }
  }
`;

export const TRACK_USAGE = gql`
  mutation TrackUsage($usageType: UsageType!, $usageCount: Int = 1) {
    trackUsage(usageType: $usageType, usageCount: $usageCount)
  }
`;

// Billing Subscriptions (WebSocket)
export const SUBSCRIPTION_UPDATED = gql`
  subscription SubscriptionUpdated($tenantId: ID!) {
    subscriptionUpdated(tenantId: $tenantId) {
      id
      tenantId
      planId
      plan {
        id
        name
        description
        price
        billingCycle
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

export const INVOICE_CREATED = gql`
  subscription InvoiceCreated($tenantId: ID!) {
    invoiceCreated(tenantId: $tenantId) {
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
  }
`;

export const PAYMENT_PROCESSED = gql`
  subscription PaymentProcessed($tenantId: ID!) {
    paymentProcessed(tenantId: $tenantId) {
      id
      tenantId
      invoiceId
      invoice {
        id
        invoiceNumber
        amount
        status
      }
      amount
      currency
      status
      paymentMethod
      gatewayProvider
      gatewayTransactionId
      failureReason
      createdAt
    }
  }
`;

export const USAGE_UPDATED = gql`
  subscription UsageUpdated($tenantId: ID!) {
    usageUpdated(tenantId: $tenantId) {
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
`;
