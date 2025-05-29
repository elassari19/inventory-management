/**
 * Subscription and Billing Service
 * Handles subscription management, billing, and payment processing
 */

import { Pool } from 'pg';
import pool from '../db/config';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  features: Record<string, boolean>;
  limits: Record<string, number>;
  active: boolean;
  trialDays: number;
  sortOrder: number;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  paymentMethodId?: string;
  externalSubscriptionId?: string;
  plan?: SubscriptionPlan;
}

export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: 'CARD' | 'BANK_ACCOUNT' | 'PAYPAL';
  details: Record<string, any>;
  isDefault: boolean;
  expiryDate?: Date;
  externalPaymentMethodId?: string;
  lastFour?: string;
  brand?: string;
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
  dueDate: Date;
  paidDate?: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  billingDetails: Record<string, any>;
  externalInvoiceId?: string;
}

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  invoiceId?: string;
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
  gatewayProvider: 'STRIPE' | 'PAYZONE';
  gatewayTransactionId?: string;
  gatewayReference?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionUsage {
  id: string;
  tenantId: string;
  subscriptionId: string;
  usageType: 'API_CALLS' | 'STORAGE' | 'USERS' | 'LOCATIONS' | 'PRODUCTS';
  usageCount: number;
  usagePeriodStart: Date;
  usagePeriodEnd: Date;
}

export class SubscriptionBillingService {
  /**
   * Get all available subscription plans
   */
  static async getSubscriptionPlans(
    activeOnly = true
  ): Promise<SubscriptionPlan[]> {
    const query = `
      SELECT * FROM subscription_plans 
      ${activeOnly ? 'WHERE active = true' : ''}
      ORDER BY sort_order, price
    `;

    const result = await pool.query(query, activeOnly ? [] : []);
    return result.rows.map(this.mapSubscriptionPlan);
  }

  /**
   * Get subscription plan by ID
   */
  static async getSubscriptionPlan(
    planId: string
  ): Promise<SubscriptionPlan | null> {
    const query = 'SELECT * FROM subscription_plans WHERE id = $1';
    const result = await pool.query(query, [planId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapSubscriptionPlan(result.rows[0]);
  }

  /**
   * Get tenant's current subscription
   */
  static async getTenantSubscription(
    tenantId: string
  ): Promise<TenantSubscription | null> {
    const query = `
      SELECT ts.*, sp.name as plan_name, sp.description as plan_description,
             sp.features as plan_features, sp.limits as plan_limits,
             sp.price as plan_price, sp.billing_cycle as plan_billing_cycle
      FROM tenant_subscriptions ts
      LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.tenant_id = $1 
      AND ts.status IN ('TRIAL', 'ACTIVE', 'PAST_DUE')
      ORDER BY ts.created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapTenantSubscription(result.rows[0]);
  }

  /**
   * Create a new subscription for a tenant
   */
  static async createSubscription(
    tenantId: string,
    planId: string,
    paymentMethodId?: string,
    trialDays?: number
  ): Promise<TenantSubscription> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get the plan details
      const plan = await this.getSubscriptionPlan(planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Cancel any existing active subscriptions
      await client.query(
        `UPDATE tenant_subscriptions 
         SET status = 'CANCELED', canceled_at = NOW(), updated_at = NOW()
         WHERE tenant_id = $1 AND status IN ('TRIAL', 'ACTIVE', 'PAST_DUE')`,
        [tenantId]
      );

      // Calculate dates
      const startDate = new Date();
      const trialEndDate = trialDays
        ? new Date(startDate.getTime() + trialDays * 24 * 60 * 60 * 1000)
        : plan.trialDays > 0
        ? new Date(startDate.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
        : null;

      const currentPeriodStart = trialEndDate || startDate;
      const currentPeriodEnd = this.calculatePeriodEnd(
        currentPeriodStart,
        plan.billingCycle
      );

      // Create Stripe subscription if payment method is provided
      let externalSubscriptionId: string | null = null;
      if (paymentMethodId && !trialEndDate) {
        // Create Stripe subscription
        const stripeSubscription = await stripe.subscriptions.create({
          customer: await this.getOrCreateStripeCustomer(tenantId),
          items: [{ price: await this.getOrCreateStripePrice(plan) }],
          default_payment_method: paymentMethodId,
        });
        externalSubscriptionId = stripeSubscription.id;
      }

      // Create subscription record
      const subscriptionId = uuidv4();
      const query = `
        INSERT INTO tenant_subscriptions (
          id, tenant_id, plan_id, status, start_date, trial_end_date,
          current_period_start, current_period_end, payment_method_id,
          external_subscription_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const status = trialEndDate ? 'TRIAL' : 'ACTIVE';
      const result = await client.query(query, [
        subscriptionId,
        tenantId,
        planId,
        status,
        startDate,
        trialEndDate,
        currentPeriodStart,
        currentPeriodEnd,
        paymentMethodId,
        externalSubscriptionId,
      ]);

      await client.query('COMMIT');
      return this.mapTenantSubscription(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Change subscription plan
   */
  static async changeSubscriptionPlan(
    tenantId: string,
    newPlanId: string,
    immediate = false
  ): Promise<TenantSubscription> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current subscription
      const currentSubscription = await this.getTenantSubscription(tenantId);
      if (!currentSubscription) {
        throw new Error('No active subscription found');
      }

      // Get new plan
      const newPlan = await this.getSubscriptionPlan(newPlanId);
      if (!newPlan) {
        throw new Error('New subscription plan not found');
      }

      // Update subscription
      const query = `
        UPDATE tenant_subscriptions 
        SET plan_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await client.query(query, [
        newPlanId,
        currentSubscription.id,
      ]);

      // Update Stripe subscription if exists
      if (currentSubscription.externalSubscriptionId) {
        await stripe.subscriptions.update(
          currentSubscription.externalSubscriptionId,
          {
            items: [
              {
                id: (
                  await stripe.subscriptions.retrieve(
                    currentSubscription.externalSubscriptionId
                  )
                ).items.data[0].id,
                price: await this.getOrCreateStripePrice(newPlan),
              },
            ],
            proration_behavior: immediate
              ? 'always_invoice'
              : 'create_prorations',
          }
        );
      }

      await client.query('COMMIT');
      return this.mapTenantSubscription(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    tenantId: string,
    immediate = false
  ): Promise<TenantSubscription> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const subscription = await this.getTenantSubscription(tenantId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      const canceledAt = new Date();
      let endDate = immediate ? canceledAt : subscription.currentPeriodEnd;

      // Update subscription
      const query = `
        UPDATE tenant_subscriptions 
        SET status = 'CANCELED', canceled_at = $1, end_date = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await client.query(query, [
        canceledAt,
        endDate,
        subscription.id,
      ]);

      // Cancel Stripe subscription if exists
      if (subscription.externalSubscriptionId) {
        await stripe.subscriptions.update(subscription.externalSubscriptionId, {
          cancel_at_period_end: !immediate,
        });

        if (immediate) {
          await stripe.subscriptions.cancel(
            subscription.externalSubscriptionId
          );
        }
      }

      await client.query('COMMIT');
      return this.mapTenantSubscription(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add payment method
   */
  static async addPaymentMethod(
    tenantId: string,
    type: 'CARD' | 'BANK_ACCOUNT' | 'PAYPAL',
    paymentMethodData: any,
    setAsDefault = false
  ): Promise<PaymentMethod> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create Stripe payment method
      const stripePaymentMethod = await stripe.paymentMethods.create({
        type: type.toLowerCase() as any,
        ...paymentMethodData,
      });

      // Attach to customer
      const customerId = await this.getOrCreateStripeCustomer(tenantId);
      await stripe.paymentMethods.attach(stripePaymentMethod.id, {
        customer: customerId,
      });

      // Set other payment methods as non-default if this is default
      if (setAsDefault) {
        await client.query(
          'UPDATE payment_methods SET is_default = false WHERE tenant_id = $1',
          [tenantId]
        );
      }

      // Create payment method record
      const paymentMethodId = uuidv4();
      const query = `
        INSERT INTO payment_methods (
          id, tenant_id, type, details, is_default, 
          external_payment_method_id, last_four, brand
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const details = {
        fingerprint: stripePaymentMethod.card?.fingerprint,
        exp_month: stripePaymentMethod.card?.exp_month,
        exp_year: stripePaymentMethod.card?.exp_year,
      };

      const result = await client.query(query, [
        paymentMethodId,
        tenantId,
        type,
        JSON.stringify(details),
        setAsDefault,
        stripePaymentMethod.id,
        stripePaymentMethod.card?.last4,
        stripePaymentMethod.card?.brand,
      ]);

      await client.query('COMMIT');
      return this.mapPaymentMethod(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get tenant's payment methods
   */
  static async getPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    const query = `
      SELECT * FROM payment_methods 
      WHERE tenant_id = $1 
      ORDER BY is_default DESC, created_at DESC
    `;

    const result = await pool.query(query, [tenantId]);
    return result.rows.map(this.mapPaymentMethod);
  }

  /**
   * Generate and create invoice
   */
  static async createInvoice(
    tenantId: string,
    subscriptionId: string,
    amount: number,
    dueDate: Date,
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>,
    billingDetails: Record<string, any> = {}
  ): Promise<Invoice> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate invoice number
      const invoiceNumberResult = await client.query(
        'SELECT generate_invoice_number()'
      );
      const invoiceNumber = invoiceNumberResult.rows[0].generate_invoice_number;

      // Calculate totals
      const taxAmount = amount * 0.1; // 10% tax (adjust as needed)
      const totalAmount = amount + taxAmount;

      // Create invoice
      const invoiceId = uuidv4();
      const query = `
        INSERT INTO invoices (
          id, invoice_number, tenant_id, subscription_id, amount,
          tax_amount, total_amount, currency, status, due_date,
          items, billing_details
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const result = await client.query(query, [
        invoiceId,
        invoiceNumber,
        tenantId,
        subscriptionId,
        amount,
        taxAmount,
        totalAmount,
        'USD',
        'PENDING',
        dueDate,
        JSON.stringify(items),
        JSON.stringify(billingDetails),
      ]);

      await client.query('COMMIT');
      return this.mapInvoice(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get tenant's invoices
   */
  static async getInvoices(tenantId: string, limit = 50): Promise<Invoice[]> {
    const query = `
      SELECT * FROM invoices 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;

    const result = await pool.query(query, [tenantId, limit]);
    return result.rows.map(this.mapInvoice);
  }

  /**
   * Process payment for invoice
   */
  static async processPayment(
    invoiceId: string,
    paymentMethodId: string
  ): Promise<PaymentTransaction> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get invoice
      const invoiceQuery = 'SELECT * FROM invoices WHERE id = $1';
      const invoiceResult = await client.query(invoiceQuery, [invoiceId]);

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = this.mapInvoice(invoiceResult.rows[0]);

      // Create payment transaction
      const transactionId = uuidv4();
      const transactionQuery = `
        INSERT INTO payment_transactions (
          id, tenant_id, invoice_id, amount, currency, status,
          payment_method, gateway_provider
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const transactionResult = await client.query(transactionQuery, [
        transactionId,
        invoice.tenantId,
        invoiceId,
        invoice.totalAmount,
        invoice.currency,
        'PROCESSING',
        paymentMethodId,
        'STRIPE',
      ]);

      // Process payment with Stripe
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(invoice.totalAmount * 100), // Convert to cents
          currency: invoice.currency.toLowerCase(),
          payment_method: paymentMethodId,
          confirm: true,
          metadata: {
            invoice_id: invoiceId,
            tenant_id: invoice.tenantId,
          },
        });

        // Update transaction with success
        await client.query(
          `UPDATE payment_transactions 
           SET status = 'SUCCEEDED', gateway_transaction_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [paymentIntent.id, transactionId]
        );

        // Update invoice as paid
        await client.query(
          `UPDATE invoices 
           SET status = 'PAID', paid_date = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [invoiceId]
        );
      } catch (stripeError: any) {
        // Update transaction with failure
        await client.query(
          `UPDATE payment_transactions 
           SET status = 'FAILED', failure_reason = $1, updated_at = NOW()
           WHERE id = $2`,
          [stripeError.message, transactionId]
        );

        throw stripeError;
      }

      await client.query('COMMIT');

      // Return updated transaction
      const updatedResult = await pool.query(
        'SELECT * FROM payment_transactions WHERE id = $1',
        [transactionId]
      );

      return this.mapPaymentTransaction(updatedResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check subscription limits
   */
  static async checkSubscriptionLimit(
    tenantId: string,
    limitType:
      | 'max_products'
      | 'max_locations'
      | 'max_users'
      | 'api_calls_per_month'
      | 'storage_gb',
    currentUsage = 1
  ): Promise<boolean> {
    const query = 'SELECT check_subscription_limit($1, $2, $3)';
    const result = await pool.query(query, [tenantId, limitType, currentUsage]);
    return result.rows[0].check_subscription_limit;
  }

  /**
   * Track subscription usage
   */
  static async trackUsage(
    tenantId: string,
    usageType: 'API_CALLS' | 'STORAGE' | 'USERS' | 'LOCATIONS' | 'PRODUCTS',
    usageCount = 1
  ): Promise<void> {
    const subscription = await this.getTenantSubscription(tenantId);
    if (!subscription) return;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const query = `
      INSERT INTO subscription_usage (
        id, tenant_id, subscription_id, usage_type, usage_count,
        usage_period_start, usage_period_end
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (tenant_id, subscription_id, usage_type, usage_period_start)
      DO UPDATE SET usage_count = subscription_usage.usage_count + $5, updated_at = NOW()
    `;

    await pool.query(query, [
      uuidv4(),
      tenantId,
      subscription.id,
      usageType,
      usageCount,
      periodStart,
      periodEnd,
    ]);
  }

  // Helper methods
  private static mapSubscriptionPlan(row: any): SubscriptionPlan {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      billingCycle: row.billing_cycle,
      features: row.features,
      limits: row.limits,
      active: row.active,
      trialDays: row.trial_days || 0,
      sortOrder: row.sort_order || 0,
    };
  }

  private static mapTenantSubscription(row: any): TenantSubscription {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      planId: row.plan_id,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      trialEndDate: row.trial_end_date,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      canceledAt: row.canceled_at,
      paymentMethodId: row.payment_method_id,
      externalSubscriptionId: row.external_subscription_id,
      plan: row.plan_name
        ? {
            id: row.plan_id,
            name: row.plan_name,
            description: row.plan_description,
            features: row.plan_features,
            limits: row.plan_limits,
            price: parseFloat(row.plan_price),
            billingCycle: row.plan_billing_cycle,
            active: true,
            trialDays: 0,
            sortOrder: 0,
          }
        : undefined,
    };
  }

  private static mapPaymentMethod(row: any): PaymentMethod {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type,
      details: row.details,
      isDefault: row.is_default,
      expiryDate: row.expiry_date,
      externalPaymentMethodId: row.external_payment_method_id,
      lastFour: row.last_four,
      brand: row.brand,
    };
  }

  private static mapInvoice(row: any): Invoice {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      tenantId: row.tenant_id,
      subscriptionId: row.subscription_id,
      amount: parseFloat(row.amount),
      taxAmount: parseFloat(row.tax_amount),
      totalAmount: parseFloat(row.total_amount),
      currency: row.currency,
      status: row.status,
      dueDate: row.due_date,
      paidDate: row.paid_date,
      items: row.items,
      billingDetails: row.billing_details,
      externalInvoiceId: row.external_invoice_id,
    };
  }

  private static mapPaymentTransaction(row: any): PaymentTransaction {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      invoiceId: row.invoice_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      paymentMethod: row.payment_method,
      gatewayProvider: row.gateway_provider,
      gatewayTransactionId: row.gateway_transaction_id,
      gatewayReference: row.gateway_reference,
      failureReason: row.failure_reason,
      metadata: row.metadata,
    };
  }

  private static calculatePeriodEnd(
    startDate: Date,
    billingCycle: string
  ): Date {
    const endDate = new Date(startDate);

    switch (billingCycle) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'ANNUAL':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return endDate;
  }

  private static async getOrCreateStripeCustomer(
    tenantId: string
  ): Promise<string> {
    // Check if customer exists in database
    const query = 'SELECT stripe_customer_id FROM tenants WHERE id = $1';
    const result = await pool.query(query, [tenantId]);

    if (result.rows[0]?.stripe_customer_id) {
      return result.rows[0].stripe_customer_id;
    }

    // Create new Stripe customer
    const tenant = await pool.query(
      'SELECT name, contact_email FROM tenants WHERE id = $1',
      [tenantId]
    );

    const customer = await stripe.customers.create({
      email: tenant.rows[0].contact_email,
      name: tenant.rows[0].name,
      metadata: { tenant_id: tenantId },
    });

    // Update tenant with customer ID
    await pool.query(
      'UPDATE tenants SET stripe_customer_id = $1 WHERE id = $2',
      [customer.id, tenantId]
    );

    return customer.id;
  }

  private static async getOrCreateStripePrice(
    plan: SubscriptionPlan
  ): Promise<string> {
    // Check if price exists in database or create new one
    const interval = plan.billingCycle
      .toLowerCase()
      .replace('ly', '')
      .replace('quarterly', 'month');
    const intervalCount = plan.billingCycle === 'QUARTERLY' ? 3 : 1;

    const price = await stripe.prices.create({
      unit_amount: Math.round(plan.price * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval: interval === 'annual' ? 'year' : 'month',
        interval_count: intervalCount,
      },
      product_data: {
        name: plan.name,
      },
    });

    return price.id;
  }
}
