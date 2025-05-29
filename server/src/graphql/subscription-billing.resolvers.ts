/**
 * GraphQL Resolvers for Subscription and Billing
 */

import { SubscriptionBillingService } from '../services/subscription-billing.service';
import {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} from 'apollo-server-express';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// Event types for subscriptions
const SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED';
const INVOICE_CREATED = 'INVOICE_CREATED';
const PAYMENT_PROCESSED = 'PAYMENT_PROCESSED';
const USAGE_UPDATED = 'USAGE_UPDATED';

export const subscriptionBillingResolvers = {
  Query: {
    // Subscription Plans
    subscriptionPlans: async (
      _: any,
      { activeOnly }: { activeOnly?: boolean }
    ) => {
      return await SubscriptionBillingService.getSubscriptionPlans(activeOnly);
    },

    subscriptionPlan: async (_: any, { id }: { id: string }) => {
      return await SubscriptionBillingService.getSubscriptionPlan(id);
    },

    // Current Subscription
    currentSubscription: async (_: any, __: any, { user, tenantId }: any) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      return await SubscriptionBillingService.getTenantSubscription(tenantId);
    },

    subscriptionUsage: async (_: any, __: any, { user, tenantId }: any) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      // Get current subscription and usage data
      const subscription =
        await SubscriptionBillingService.getTenantSubscription(tenantId);
      if (!subscription) {
        return null;
      }

      // Get usage for different types
      const usageTypes = [
        'PRODUCTS',
        'LOCATIONS',
        'USERS',
        'API_CALLS',
        'STORAGE',
      ];
      const usageData: any = {};

      for (const type of usageTypes) {
        // This would need to be implemented to get actual usage data
        usageData[type.toLowerCase()] = {
          usageType: type,
          usageCount: 0, // Get actual count
          limitValue:
            subscription.plan?.limits[`max_${type.toLowerCase()}`] || -1,
          percentageUsed: 0,
        };
      }

      return usageData;
    },

    // Billing Info
    billingInfo: async (_: any, __: any, { user, tenantId }: any) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      const [subscription, paymentMethods, recentInvoices, recentTransactions] =
        await Promise.all([
          SubscriptionBillingService.getTenantSubscription(tenantId),
          SubscriptionBillingService.getPaymentMethods(tenantId),
          SubscriptionBillingService.getInvoices(tenantId, 5),
          // Get recent transactions - would need to implement this method
          Promise.resolve([]),
        ]);

      return {
        subscription,
        paymentMethods,
        recentInvoices,
        recentTransactions,
        usage: null, // Would implement usage summary
      };
    },

    paymentMethods: async (_: any, __: any, { user, tenantId }: any) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      return await SubscriptionBillingService.getPaymentMethods(tenantId);
    },

    invoices: async (
      _: any,
      { limit }: { limit?: number },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      return await SubscriptionBillingService.getInvoices(tenantId, limit);
    },

    invoice: async (
      _: any,
      { id }: { id: string },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      // Get invoice and verify it belongs to the tenant
      const invoices = await SubscriptionBillingService.getInvoices(
        tenantId,
        1000
      );
      const invoice = invoices.find((inv) => inv.id === id);

      if (!invoice) {
        throw new UserInputError('Invoice not found');
      }

      return invoice;
    },

    transactions: async (
      _: any,
      { limit }: { limit?: number },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      // Would need to implement getTransactions method
      return [];
    },

    checkSubscriptionLimit: async (
      _: any,
      { limitType, currentUsage }: { limitType: string; currentUsage?: number },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      return await SubscriptionBillingService.checkSubscriptionLimit(
        tenantId,
        limitType as any,
        currentUsage
      );
    },
  },

  Mutation: {
    // Subscription Management
    createSubscription: async (
      _: any,
      { input }: { input: any },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user has permission to manage billing
      if (
        !user.roles.includes('tenant_admin') &&
        !user.roles.includes('super_admin')
      ) {
        throw new ForbiddenError(
          'Insufficient permissions to manage subscriptions'
        );
      }

      const subscription = await SubscriptionBillingService.createSubscription(
        tenantId,
        input.planId,
        input.paymentMethodId,
        input.trialDays
      );

      // Publish subscription update
      pubsub.publish(SUBSCRIPTION_UPDATED, {
        subscriptionUpdated: subscription,
        tenantId,
      });

      return subscription;
    },

    changeSubscriptionPlan: async (
      _: any,
      { input }: { input: any },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      if (
        !user.roles.includes('tenant_admin') &&
        !user.roles.includes('super_admin')
      ) {
        throw new ForbiddenError(
          'Insufficient permissions to manage subscriptions'
        );
      }

      const subscription =
        await SubscriptionBillingService.changeSubscriptionPlan(
          tenantId,
          input.newPlanId,
          input.immediate
        );

      pubsub.publish(SUBSCRIPTION_UPDATED, {
        subscriptionUpdated: subscription,
        tenantId,
      });

      return subscription;
    },

    cancelSubscription: async (
      _: any,
      { immediate }: { immediate?: boolean },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      if (
        !user.roles.includes('tenant_admin') &&
        !user.roles.includes('super_admin')
      ) {
        throw new ForbiddenError(
          'Insufficient permissions to manage subscriptions'
        );
      }

      const subscription = await SubscriptionBillingService.cancelSubscription(
        tenantId,
        immediate
      );

      pubsub.publish(SUBSCRIPTION_UPDATED, {
        subscriptionUpdated: subscription,
        tenantId,
      });

      return subscription;
    },

    resumeSubscription: async (_: any, __: any, { user, tenantId }: any) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      if (
        !user.roles.includes('tenant_admin') &&
        !user.roles.includes('super_admin')
      ) {
        throw new ForbiddenError(
          'Insufficient permissions to manage subscriptions'
        );
      }

      // Would need to implement resume subscription logic
      throw new UserInputError('Resume subscription not yet implemented');
    },

    // Payment Methods
    addPaymentMethod: async (
      _: any,
      { input }: { input: any },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      if (
        !user.roles.includes('tenant_admin') &&
        !user.roles.includes('super_admin')
      ) {
        throw new ForbiddenError(
          'Insufficient permissions to manage payment methods'
        );
      }

      // Convert input to Stripe format
      const paymentMethodData = {
        card: {
          number: input.cardNumber,
          exp_month: input.expiryMonth,
          exp_year: input.expiryYear,
          cvc: input.cvv,
        },
        billing_details: {
          address: input.billingAddress,
        },
      };

      return await SubscriptionBillingService.addPaymentMethod(
        tenantId,
        input.type,
        paymentMethodData,
        input.setAsDefault
      );
    },

    setDefaultPaymentMethod: async (
      _: any,
      { paymentMethodId }: { paymentMethodId: string },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      if (
        !user.roles.includes('tenant_admin') &&
        !user.roles.includes('super_admin')
      ) {
        throw new ForbiddenError(
          'Insufficient permissions to manage payment methods'
        );
      }

      // Would need to implement setDefaultPaymentMethod
      throw new UserInputError(
        'Set default payment method not yet implemented'
      );
    },

    removePaymentMethod: async (
      _: any,
      { paymentMethodId }: { paymentMethodId: string },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      if (
        !user.roles.includes('tenant_admin') &&
        !user.roles.includes('super_admin')
      ) {
        throw new ForbiddenError(
          'Insufficient permissions to manage payment methods'
        );
      }

      // Would need to implement removePaymentMethod
      throw new UserInputError('Remove payment method not yet implemented');
    },

    // Billing
    createInvoice: async (
      _: any,
      { input }: { input: any },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      if (
        !user.roles.includes('tenant_admin') &&
        !user.roles.includes('super_admin')
      ) {
        throw new ForbiddenError('Insufficient permissions to create invoices');
      }

      const invoice = await SubscriptionBillingService.createInvoice(
        tenantId,
        input.subscriptionId,
        input.amount,
        new Date(input.dueDate),
        input.items,
        input.billingDetails
      );

      pubsub.publish(INVOICE_CREATED, {
        invoiceCreated: invoice,
        tenantId,
      });

      return invoice;
    },

    processPayment: async (
      _: any,
      {
        invoiceId,
        paymentMethodId,
      }: { invoiceId: string; paymentMethodId: string },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      if (
        !user.roles.includes('tenant_admin') &&
        !user.roles.includes('super_admin')
      ) {
        throw new ForbiddenError(
          'Insufficient permissions to process payments'
        );
      }

      const transaction = await SubscriptionBillingService.processPayment(
        invoiceId,
        paymentMethodId
      );

      pubsub.publish(PAYMENT_PROCESSED, {
        paymentProcessed: transaction,
        tenantId,
      });

      return transaction;
    },

    retryPayment: async (
      _: any,
      { transactionId }: { transactionId: string },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      if (
        !user.roles.includes('tenant_admin') &&
        !user.roles.includes('super_admin')
      ) {
        throw new ForbiddenError('Insufficient permissions to retry payments');
      }

      // Would need to implement retry payment logic
      throw new UserInputError('Retry payment not yet implemented');
    },

    // Usage Tracking
    trackUsage: async (
      _: any,
      { usageType, usageCount }: { usageType: string; usageCount?: number },
      { user, tenantId }: any
    ) => {
      if (!user || !tenantId) {
        throw new AuthenticationError('Authentication required');
      }

      await SubscriptionBillingService.trackUsage(
        tenantId,
        usageType as any,
        usageCount
      );

      return true;
    },
  },

  Subscription: {
    subscriptionUpdated: {
      subscribe: (parent: any, { tenantId }: { tenantId: string }) => {
        return pubsub.asyncIterableIterator([SUBSCRIPTION_UPDATED]);
      },
    },

    invoiceCreated: {
      subscribe: (parent: any, { tenantId }: { tenantId: string }) => {
        return pubsub.asyncIterableIterator([INVOICE_CREATED]);
      },
    },

    paymentProcessed: {
      subscribe: (parent: any, { tenantId }: { tenantId: string }) => {
        return pubsub.asyncIterableIterator([PAYMENT_PROCESSED]);
      },
    },

    usageUpdated: {
      subscribe: (parent: any, { tenantId }: { tenantId: string }) => {
        return pubsub.asyncIterableIterator([USAGE_UPDATED]);
      },
    },
  },

  // Field resolvers
  TenantSubscription: {
    isInTrial: (subscription: any) => {
      if (!subscription.trialEndDate) return false;
      return new Date() < new Date(subscription.trialEndDate);
    },

    daysUntilRenewal: (subscription: any) => {
      const now = new Date();
      const renewalDate = new Date(subscription.currentPeriodEnd);
      const diffTime = renewalDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    },
  },

  SubscriptionUsage: {
    percentageUsed: (usage: any) => {
      if (usage.limitValue === -1 || usage.limitValue === 0) return 0;
      return Math.min(100, (usage.usageCount / usage.limitValue) * 100);
    },
  },
};
