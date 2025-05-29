import { useState } from 'react';
import {
  CreditCard,
  Package,
  Calendar,
  Download,
  Activity,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useToast } from '../components/ui/ToastProvider';

// Sample data - this would come from GraphQL in real implementation
const currentSubscription = {
  id: 'sub_1',
  planName: 'Professional',
  status: 'active',
  amount: 79.99,
  currency: 'USD',
  billingCycle: 'monthly',
  currentPeriodStart: '2024-01-01',
  currentPeriodEnd: '2024-02-01',
  cancelAtPeriodEnd: false,
  trialEndDate: null,
};

const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    billingCycle: 'monthly',
    features: [
      'Up to 100 products',
      '1 location',
      '2 users',
      'Basic reporting',
      'Email support',
    ],
    limits: {
      products: 100,
      locations: 1,
      users: 2,
      apiCalls: 1000,
      storage: '1 GB',
    },
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses',
    price: 79.99,
    billingCycle: 'monthly',
    features: [
      'Up to 1,000 products',
      '3 locations',
      '5 users',
      'Advanced reporting',
      'Priority support',
      'API access',
      'Barcode scanning',
    ],
    limits: {
      products: 1000,
      locations: 3,
      users: 5,
      apiCalls: 10000,
      storage: '10 GB',
    },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 199.99,
    billingCycle: 'monthly',
    features: [
      'Unlimited products',
      'Unlimited locations',
      '15 users',
      'Custom reports',
      'Dedicated support',
      'Custom integrations',
      'SSO',
      'Custom branding',
    ],
    limits: {
      products: 'Unlimited',
      locations: 'Unlimited',
      users: 15,
      apiCalls: 'Unlimited',
      storage: '100 GB',
    },
    popular: false,
  },
];

const recentInvoices = [
  {
    id: 'inv_1',
    invoiceNumber: 'INV-2024-001',
    amount: 79.99,
    status: 'paid',
    dueDate: '2024-01-15',
    paidDate: '2024-01-12',
    description: 'Professional Plan - January 2024',
  },
  {
    id: 'inv_2',
    invoiceNumber: 'INV-2023-012',
    amount: 79.99,
    status: 'paid',
    dueDate: '2023-12-15',
    paidDate: '2023-12-14',
    description: 'Professional Plan - December 2023',
  },
  {
    id: 'inv_3',
    invoiceNumber: 'INV-2023-011',
    amount: 79.99,
    status: 'paid',
    dueDate: '2023-11-15',
    paidDate: '2023-11-13',
    description: 'Professional Plan - November 2023',
  },
];

const usageMetrics = {
  products: { current: 247, limit: 1000, percentage: 24.7 },
  locations: { current: 2, limit: 3, percentage: 66.7 },
  users: { current: 3, limit: 5, percentage: 60 },
  apiCalls: { current: 1247, limit: 10000, percentage: 12.47 },
  storage: { current: '2.1 GB', limit: '10 GB', percentage: 21 },
};

const paymentMethods = [
  {
    id: 'pm_1',
    type: 'card',
    brand: 'visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: 'pm_2',
    type: 'card',
    brand: 'mastercard',
    last4: '5555',
    expiryMonth: 8,
    expiryYear: 2026,
    isDefault: false,
  },
];

export function BillingPage() {
  const { toast } = useToast();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly'
  );

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId);
    setShowPlanModal(true);
  };

  const confirmPlanChange = () => {
    // In real implementation, this would call the GraphQL mutation
    toast({
      title: 'Plan Updated',
      description: `Successfully changed to ${selectedPlan} plan`,
      type: 'success',
    });
    setShowPlanModal(false);
    setSelectedPlan(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trial':
        return 'warning';
      case 'past_due':
        return 'destructive';
      case 'canceled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription, billing, and usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPaymentModal(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Payment Methods
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
        </div>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>
                Your active subscription details and billing information
              </CardDescription>
            </div>
            <Badge variant={getStatusColor(currentSubscription.status)}>
              {currentSubscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Plan
                </p>
                <p className="text-2xl font-bold">
                  {currentSubscription.planName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Amount
                </p>
                <p className="text-xl font-semibold">
                  {formatCurrency(currentSubscription.amount)}/
                  {currentSubscription.billingCycle}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Billing Cycle
                </p>
                <p className="capitalize">{currentSubscription.billingCycle}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Period
                </p>
                <p>
                  {new Date(
                    currentSubscription.currentPeriodStart
                  ).toLocaleDateString()}{' '}
                  -{' '}
                  {new Date(
                    currentSubscription.currentPeriodEnd
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Next Billing Date
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(
                    currentSubscription.currentPeriodEnd
                  ).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handlePlanChange('professional')}
              >
                Change Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Usage Overview
          </CardTitle>
          <CardDescription>
            Monitor your current usage against plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Object.entries(usageMetrics).map(([key, usage]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium capitalize">{key}</p>
                  <p
                    className={`text-sm font-semibold ${getUsageColor(
                      usage.percentage
                    )}`}
                  >
                    {usage.percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{usage.current}</span>
                    <span>{usage.limit}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        usage.percentage >= 90
                          ? 'bg-red-500'
                          : usage.percentage >= 75
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose the plan that best fits your needs
            </CardDescription>
            <div className="flex gap-2">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === 'annual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingCycle('annual')}
              >
                Annual (Save 20%)
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionPlans.map((plan) => {
                const price =
                  billingCycle === 'annual'
                    ? plan.price * 12 * 0.8
                    : plan.price;
                const isCurrentPlan =
                  plan.name.toLowerCase() ===
                  currentSubscription.planName.toLowerCase();

                return (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-4 relative ${
                      plan.popular
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-2 left-4 bg-primary">
                        Most Popular
                      </Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge
                        variant="success"
                        className="absolute -top-2 right-4"
                      >
                        Current Plan
                      </Badge>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{plan.name}</h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {price === 0 ? 'Free' : formatCurrency(price)}
                          </p>
                          {price > 0 && (
                            <p className="text-sm text-muted-foreground">
                              /{billingCycle}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Products: {plan.limits.products}</div>
                        <div>Locations: {plan.limits.locations}</div>
                        <div>Users: {plan.limits.users}</div>
                        <div>Storage: {plan.limits.storage}</div>
                      </div>
                      {!isCurrentPlan && (
                        <Button
                          className="w-full mt-2"
                          variant={plan.popular ? 'default' : 'outline'}
                          onClick={() => handlePlanChange(plan.id)}
                        >
                          {plan.price === 0 ? 'Downgrade' : 'Upgrade'} to{' '}
                          {plan.name}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Your recent billing history</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          invoice.status === 'paid' ? 'success' : 'destructive'
                        }
                      >
                        {invoice.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(invoice.amount)}
                    </p>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Change Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="Confirm Plan Change"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to change your subscription plan? This change
            will take effect at the start of your next billing cycle.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPlanModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPlanChange}>Confirm Change</Button>
          </div>
        </div>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Payment Methods"
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Saved Payment Methods</h3>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• {method.last4}</p>
                    <p className="text-sm text-muted-foreground">
                      {method.brand.toUpperCase()} expires {method.expiryMonth}/
                      {method.expiryYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault && <Badge variant="outline">Default</Badge>}
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Add New Payment Method</h3>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" placeholder="MM/YY" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" />
                </div>
                <div>
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input id="cardName" placeholder="John Doe" />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Add Payment Method
              </Button>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}
