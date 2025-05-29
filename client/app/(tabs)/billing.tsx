import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  RefreshControl,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  Card,
  Button,
  Switch,
  Chip,
  Badge,
  FAB,
  Portal,
  Modal,
  Divider,
  ProgressBar,
  ActivityIndicator,
} from 'react-native-paper';
import { format } from 'date-fns';
import {
  useBillingInfo,
  useSubscriptionPlans,
  useChangeSubscriptionPlan,
  useCancelSubscription,
  useResumeSubscription,
} from '../../hooks/useBilling';

// Mock data for development - this will be replaced with real GraphQL data
const mockSubscriptionData = {
  currentPlan: {
    id: 'pro-001',
    name: 'Professional',
    amount: 29.99,
    billingCycle: 'monthly',
    status: 'active',
    nextBillingDate: '2024-02-15T00:00:00Z',
  },
  usage: {
    items: { current: 2450, limit: 5000 },
    locations: { current: 12, limit: 25 },
    users: { current: 8, limit: 50 },
    storage: { current: 1.2, limit: 10 },
  },
  availablePlans: [
    {
      id: 'basic-001',
      name: 'Basic',
      price: { monthly: 9.99, annually: 99.99 },
      features: [
        'Up to 1,000 items',
        '5 locations',
        '10 users',
        'Email support',
      ],
      limits: { items: 1000, locations: 5, users: 10 },
      popular: false,
    },
    {
      id: 'pro-001',
      name: 'Professional',
      price: { monthly: 29.99, annually: 299.99 },
      features: [
        'Up to 5,000 items',
        '25 locations',
        '50 users',
        'Priority support',
      ],
      limits: { items: 5000, locations: 25, users: 50 },
      popular: true,
    },
    {
      id: 'ent-001',
      name: 'Enterprise',
      price: { monthly: 99.99, annually: 999.99 },
      features: [
        'Unlimited items',
        'Unlimited locations',
        'Unlimited users',
        '24/7 support',
      ],
      limits: { items: -1, locations: -1, users: -1 },
      popular: false,
    },
  ],
  recentInvoices: [
    {
      id: 'inv-001',
      number: 'INV-2024-001',
      amount: 29.99,
      currency: 'USD',
      status: 'paid',
      dueDate: '2024-01-15T00:00:00Z',
      paidAt: '2024-01-14T10:30:00Z',
    },
    {
      id: 'inv-002',
      number: 'INV-2023-012',
      amount: 29.99,
      currency: 'USD',
      status: 'paid',
      dueDate: '2023-12-15T00:00:00Z',
      paidAt: '2023-12-14T15:45:00Z',
    },
  ],
};

export default function BillingScreen() {
  const colorScheme = useColorScheme();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // GraphQL hooks for real data
  const {
    data: billingData,
    loading: billingLoading,
    refetch: refetchBilling,
  } = useBillingInfo();
  const { data: plansData, loading: plansLoading } = useSubscriptionPlans();
  const [changeSubscriptionPlan] = useChangeSubscriptionPlan();
  const [cancelSubscription] = useCancelSubscription();
  const [resumeSubscription] = useResumeSubscription();

  // Use real data when available, fallback to mock data
  const currentPlan =
    billingData?.billingInfo?.subscription || mockSubscriptionData.currentPlan;
  const usage = billingData?.billingInfo?.usage || mockSubscriptionData.usage;
  const availablePlans =
    plansData?.subscriptionPlans || mockSubscriptionData.availablePlans;
  const recentInvoices =
    billingData?.billingInfo?.recentInvoices ||
    mockSubscriptionData.recentInvoices;

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return '#FF3B30';
    if (percentage >= 75) return '#FF9500';
    return '#34C759';
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId);
    setShowPlanModal(true);
  };

  const confirmPlanChange = () => {
    Alert.alert(
      'Confirm Plan Change',
      `Are you sure you want to change to the ${
        availablePlans.find((p) => p.id === selectedPlan)?.name
      } plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setShowPlanModal(false);
            Alert.alert('Success', 'Plan change request submitted');
          },
        },
      ]
    );
  };

  const handlePaymentMethodsPress = () => {
    setShowPaymentModal(true);
  };

  const renderUsageCard = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <IconSymbol
              name="chart.bar"
              size={20}
              color={Colors[colorScheme ?? 'light'].tint}
            />
            <ThemedText style={styles.cardTitle}>Usage Overview</ThemedText>
          </View>
        </View>

        <View style={styles.usageGrid}>
          {Object.entries(usage).map(([key, data]: [string, any]) => {
            const percentage = getUsagePercentage(data.current, data.limit);
            const color = getUsageColor(percentage);

            return (
              <View key={key} style={styles.usageItem}>
                <View style={styles.usageHeader}>
                  <ThemedText style={styles.usageLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </ThemedText>
                  <ThemedText style={styles.usageValue}>
                    {data.current.toLocaleString()}
                    {data.limit !== -1 && ` / ${data.limit.toLocaleString()}`}
                  </ThemedText>
                </View>
                {data.limit !== -1 && (
                  <ProgressBar
                    progress={percentage / 100}
                    color={color}
                    style={styles.progressBar}
                  />
                )}
                {percentage >= 90 && (
                  <ThemedText style={[styles.warningText, { color }]}>
                    {percentage >= 100 ? 'Limit exceeded' : 'Near limit'}
                  </ThemedText>
                )}
              </View>
            );
          })}
        </View>
      </Card.Content>
    </Card>
  );

  const renderCurrentPlan = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <IconSymbol
              name="creditcard"
              size={20}
              color={Colors[colorScheme ?? 'light'].tint}
            />
            <ThemedText style={styles.cardTitle}>
              Current Subscription
            </ThemedText>
          </View>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { backgroundColor: '#34C759' + '20' }]}
          >
            <ThemedText style={[styles.statusText, { color: '#34C759' }]}>
              {currentPlan.status.toUpperCase()}
            </ThemedText>
          </Chip>
        </View>

        <View style={styles.planDetails}>
          <ThemedText style={styles.planName}>
            {currentPlan.name} Plan
          </ThemedText>
          <ThemedText style={styles.planAmount}>
            ${currentPlan.amount} / {currentPlan.billingCycle}
          </ThemedText>
          <ThemedText style={styles.billingDate}>
            Next billing:{' '}
            {format(new Date(currentPlan.nextBillingDate), 'MMM dd, yyyy')}
          </ThemedText>
        </View>

        <View style={styles.planActions}>
          <Button
            mode="outlined"
            onPress={handlePaymentMethodsPress}
            style={styles.actionButton}
          >
            Payment Methods
          </Button>
          <Button
            mode="contained"
            onPress={() => setShowPlanModal(true)}
            style={styles.actionButton}
          >
            Change Plan
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderAvailablePlans = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <IconSymbol
              name="rectangle.stack"
              size={20}
              color={Colors[colorScheme ?? 'light'].tint}
            />
            <ThemedText style={styles.cardTitle}>Available Plans</ThemedText>
          </View>
          <View style={styles.billingToggle}>
            <ThemedText style={styles.toggleLabel}>Monthly</ThemedText>
            <Switch
              value={isAnnual}
              onValueChange={setIsAnnual}
              trackColor={{ false: '#E0E0E0', true: '#007BFF' }}
              thumbColor={isAnnual ? '#FFF' : '#FFF'}
            />
            <ThemedText style={styles.toggleLabel}>Annual</ThemedText>
          </View>
        </View>

        <View style={styles.plansGrid}>
          {availablePlans.map((plan: any) => (
            <View key={plan.id} style={styles.planCard}>
              {plan.popular && (
                <Badge style={styles.popularBadge}>Most Popular</Badge>
              )}
              <ThemedText style={styles.planCardName}>{plan.name}</ThemedText>
              <ThemedText style={styles.planCardPrice}>
                ${isAnnual ? plan.price.annually : plan.price.monthly}
                {plan.price.monthly > 0 && (
                  <ThemedText style={styles.planCardPeriod}>
                    /{isAnnual ? 'year' : 'month'}
                  </ThemedText>
                )}
              </ThemedText>

              <View style={styles.planFeatures}>
                {plan.features.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureItem}>
                    <IconSymbol name="checkmark" size={16} color="#34C759" />
                    <ThemedText style={styles.featureText}>
                      {feature}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <Button
                mode={plan.id === currentPlan.id ? 'outlined' : 'contained'}
                onPress={() => handlePlanChange(plan.id)}
                style={styles.planButton}
                disabled={plan.id === currentPlan.id}
              >
                {plan.id === currentPlan.id ? 'Current Plan' : 'Select Plan'}
              </Button>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderRecentInvoices = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <IconSymbol
              name="doc.text"
              size={20}
              color={Colors[colorScheme ?? 'light'].tint}
            />
            <ThemedText style={styles.cardTitle}>Recent Invoices</ThemedText>
          </View>
        </View>

        <View style={styles.invoicesList}>
          {recentInvoices.map((invoice: any, index: number) => (
            <View key={invoice.id}>
              <View style={styles.invoiceItem}>
                <View style={styles.invoiceDetails}>
                  <ThemedText style={styles.invoiceNumber}>
                    {invoice.number}
                  </ThemedText>
                  <ThemedText style={styles.invoiceDate}>
                    {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                  </ThemedText>
                </View>
                <View style={styles.invoiceActions}>
                  <ThemedText style={styles.invoiceAmount}>
                    ${invoice.amount.toFixed(2)}
                  </ThemedText>
                  <Chip
                    mode="outlined"
                    style={[
                      styles.statusChip,
                      { backgroundColor: '#34C759' + '20' },
                    ]}
                  >
                    <ThemedText
                      style={[styles.statusText, { color: '#34C759' }]}
                    >
                      {invoice.status.toUpperCase()}
                    </ThemedText>
                  </Chip>
                </View>
              </View>
              {index < recentInvoices.length - 1 && (
                <Divider style={styles.divider} />
              )}
            </View>
          ))}
        </View>

        <Button
          mode="outlined"
          onPress={() =>
            Alert.alert('Coming Soon', 'Invoice history will be available soon')
          }
          style={styles.fullWidthButton}
        >
          View All Invoices
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconSymbol
            name="creditcard.fill"
            size={24}
            color={Colors[colorScheme ?? 'light'].icon}
          />
          <ThemedText style={styles.title}>Billing & Subscription</ThemedText>
        </View>

        {renderCurrentPlan()}
        {renderUsageCard()}
        {renderAvailablePlans()}
        {renderRecentInvoices()}
      </ScrollView>

      {/* Plan Change Modal */}
      <Portal>
        <Modal
          visible={showPlanModal}
          onDismiss={() => setShowPlanModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <ThemedText style={styles.modalTitle}>Change Plan</ThemedText>
          <ThemedText style={styles.modalText}>
            Are you sure you want to change to the{' '}
            {availablePlans.find((p) => p.id === selectedPlan)?.name} plan?
          </ThemedText>
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowPlanModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmPlanChange}
              style={styles.modalButton}
            >
              Confirm
            </Button>
          </View>
        </Modal>

        {/* Payment Methods Modal */}
        <Modal
          visible={showPaymentModal}
          onDismiss={() => setShowPaymentModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <ThemedText style={styles.modalTitle}>Payment Methods</ThemedText>
          <ThemedText style={styles.modalText}>
            Payment method management will be available soon.
          </ThemedText>
          <Button
            mode="contained"
            onPress={() => setShowPaymentModal(false)}
            style={styles.fullWidthButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  card: {
    marginBottom: 16,
    backgroundColor: Colors.light.cardBackground,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusChip: {
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planDetails: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  planAmount: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '500',
    marginBottom: 4,
  },
  billingDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  usageGrid: {
    gap: 16,
  },
  usageItem: {
    gap: 8,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  billingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  plansGrid: {
    gap: 16,
  },
  planCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: Colors.light.tint,
  },
  planCardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  planCardPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 16,
  },
  planCardPeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    opacity: 0.7,
  },
  planFeatures: {
    marginBottom: 16,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  planButton: {
    marginTop: 'auto',
  },
  invoicesList: {
    gap: 0,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  invoiceDetails: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  invoiceActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 4,
  },
  fullWidthButton: {
    marginTop: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
