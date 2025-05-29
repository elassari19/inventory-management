/**
 * GraphQL Schema for Subscription and Billing
 */

import { gql } from 'apollo-server-express';

export const subscriptionBillingTypeDefs = gql`
  # Enums
  enum BillingCycle {
    MONTHLY
    QUARTERLY
    ANNUAL
  }

  enum SubscriptionStatus {
    TRIAL
    ACTIVE
    PAST_DUE
    CANCELED
    EXPIRED
  }

  enum PaymentMethodType {
    CARD
    BANK_ACCOUNT
    PAYPAL
  }

  enum InvoiceStatus {
    DRAFT
    PENDING
    PAID
    FAILED
    VOID
    REFUNDED
  }

  enum TransactionStatus {
    PENDING
    PROCESSING
    SUCCEEDED
    FAILED
    REFUNDED
    CANCELED
  }

  enum UsageType {
    API_CALLS
    STORAGE
    USERS
    LOCATIONS
    PRODUCTS
  }

  # Types
  type SubscriptionPlan {
    id: ID!
    name: String!
    description: String
    price: Float!
    billingCycle: BillingCycle!
    features: JSON!
    limits: JSON!
    active: Boolean!
    trialDays: Int!
    sortOrder: Int!
  }

  type TenantSubscription {
    id: ID!
    tenantId: ID!
    planId: ID!
    plan: SubscriptionPlan
    status: SubscriptionStatus!
    startDate: DateTime!
    endDate: DateTime
    trialEndDate: DateTime
    currentPeriodStart: DateTime!
    currentPeriodEnd: DateTime!
    canceledAt: DateTime
    paymentMethodId: ID
    externalSubscriptionId: String
    isInTrial: Boolean!
    daysUntilRenewal: Int
  }

  type PaymentMethod {
    id: ID!
    tenantId: ID!
    type: PaymentMethodType!
    details: JSON!
    isDefault: Boolean!
    expiryDate: DateTime
    lastFour: String
    brand: String
    createdAt: DateTime!
  }

  type InvoiceItem {
    description: String!
    quantity: Int!
    unitPrice: Float!
    amount: Float!
  }

  type Invoice {
    id: ID!
    invoiceNumber: String!
    tenantId: ID!
    subscriptionId: ID
    amount: Float!
    taxAmount: Float!
    totalAmount: Float!
    currency: String!
    status: InvoiceStatus!
    dueDate: DateTime!
    paidDate: DateTime
    items: [InvoiceItem!]!
    billingDetails: JSON!
    createdAt: DateTime!
  }

  type PaymentTransaction {
    id: ID!
    tenantId: ID!
    invoiceId: ID
    invoice: Invoice
    amount: Float!
    currency: String!
    status: TransactionStatus!
    paymentMethod: String
    gatewayProvider: String!
    gatewayTransactionId: String
    failureReason: String
    createdAt: DateTime!
  }

  type SubscriptionUsage {
    id: ID!
    tenantId: ID!
    subscriptionId: ID!
    usageType: UsageType!
    usageCount: Int!
    usagePeriodStart: DateTime!
    usagePeriodEnd: DateTime!
    limitValue: Int
    percentageUsed: Float
  }

  type UsageSummary {
    products: SubscriptionUsage
    locations: SubscriptionUsage
    users: SubscriptionUsage
    apiCalls: SubscriptionUsage
    storage: SubscriptionUsage
  }

  type BillingInfo {
    subscription: TenantSubscription
    paymentMethods: [PaymentMethod!]!
    recentInvoices: [Invoice!]!
    recentTransactions: [PaymentTransaction!]!
    usage: UsageSummary
  }

  # Input Types
  input CreateSubscriptionInput {
    planId: ID!
    paymentMethodId: ID
    trialDays: Int
  }

  input ChangeSubscriptionPlanInput {
    newPlanId: ID!
    immediate: Boolean = false
  }

  input AddPaymentMethodInput {
    type: PaymentMethodType!
    cardNumber: String
    expiryMonth: Int
    expiryYear: Int
    cvv: String
    billingAddress: BillingAddressInput
    setAsDefault: Boolean = false
  }

  input BillingAddressInput {
    line1: String!
    line2: String
    city: String!
    state: String
    postalCode: String!
    country: String!
  }

  input CreateInvoiceInput {
    subscriptionId: ID!
    amount: Float!
    dueDate: DateTime!
    items: [InvoiceItemInput!]!
    billingDetails: JSON
  }

  input InvoiceItemInput {
    description: String!
    quantity: Int!
    unitPrice: Float!
    amount: Float!
  }

  # Queries
  extend type Query {
    # Subscription Plans
    subscriptionPlans(activeOnly: Boolean = true): [SubscriptionPlan!]!
    subscriptionPlan(id: ID!): SubscriptionPlan

    # Current Subscription
    currentSubscription: TenantSubscription
    subscriptionUsage: UsageSummary

    # Billing
    billingInfo: BillingInfo!
    paymentMethods: [PaymentMethod!]!
    invoices(limit: Int = 50): [Invoice!]!
    invoice(id: ID!): Invoice
    transactions(limit: Int = 50): [PaymentTransaction!]!

    # Usage & Limits
    checkSubscriptionLimit(limitType: String!, currentUsage: Int = 1): Boolean!
  }

  # Mutations
  extend type Mutation {
    # Subscription Management
    createSubscription(input: CreateSubscriptionInput!): TenantSubscription!
    changeSubscriptionPlan(
      input: ChangeSubscriptionPlanInput!
    ): TenantSubscription!
    cancelSubscription(immediate: Boolean = false): TenantSubscription!
    resumeSubscription: TenantSubscription!

    # Payment Methods
    addPaymentMethod(input: AddPaymentMethodInput!): PaymentMethod!
    setDefaultPaymentMethod(paymentMethodId: ID!): PaymentMethod!
    removePaymentMethod(paymentMethodId: ID!): Boolean!

    # Billing
    createInvoice(input: CreateInvoiceInput!): Invoice!
    processPayment(invoiceId: ID!, paymentMethodId: ID!): PaymentTransaction!
    retryPayment(transactionId: ID!): PaymentTransaction!

    # Usage Tracking
    trackUsage(usageType: UsageType!, usageCount: Int = 1): Boolean!
  }

  # Subscriptions (WebSocket)
  extend type Subscription {
    subscriptionUpdated(tenantId: ID!): TenantSubscription!
    invoiceCreated(tenantId: ID!): Invoice!
    paymentProcessed(tenantId: ID!): PaymentTransaction!
    usageUpdated(tenantId: ID!): UsageSummary!
  }
`;
