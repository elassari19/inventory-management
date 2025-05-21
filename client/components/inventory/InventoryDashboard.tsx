import React from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Card, Button, ProgressBar } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useRouter } from 'expo-router';

const GET_INVENTORY_SUMMARY = gql`
  query GetInventorySummary {
    inventorySummary {
      totalItems
      lowStockItems
      outOfStockItems
      totalCategories
      totalValue
      recentMovements {
        id
        type
        quantity
        itemName
        createdAt
      }
      stockByCategoryData {
        category
        itemCount
      }
      topSellingItems {
        id
        name
        quantitySold
      }
    }
  }
`;

export function InventoryDashboard() {
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery(GET_INVENTORY_SUMMARY, {
    fetchPolicy: 'cache-and-network',
  });

  const summary = data?.inventorySummary || {
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalCategories: 0,
    totalValue: 0,
    recentMovements: [],
    stockByCategoryData: [],
    topSellingItems: [],
  };

  // Calculate percentage of low stock items
  const lowStockPercentage = summary.totalItems
    ? Math.round((summary.lowStockItems / summary.totalItems) * 100)
    : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return 'arrow.down';
      case 'OUT':
        return 'arrow.up';
      case 'ADJUST':
        return 'slider.horizontal.3';
      default:
        return 'circle.fill';
    }
  };

  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={[styles.summaryCard, styles.totalItemsCard]}>
            <Card.Content style={styles.summaryCardContent}>
              <IconSymbol
                name="cube.box.fill"
                size={24}
                color={Colors.light.tint}
              />
              <ThemedText style={styles.summaryValue}>
                {summary.totalItems}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>Total Items</ThemedText>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.stockCard]}>
            <Card.Content style={styles.summaryCardContent}>
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={24}
                color="#FF9500"
              />
              <ThemedText style={styles.summaryValue}>
                {summary.lowStockItems}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>Low Stock</ThemedText>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.valueCard]}>
            <Card.Content style={styles.summaryCardContent}>
              <IconSymbol
                name="dollarsign.circle.fill"
                size={24}
                color="#34C759"
              />
              <ThemedText style={styles.summaryValue}>
                {formatCurrency(summary.totalValue)}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>
                Inventory Value
              </ThemedText>
            </Card.Content>
          </Card>
        </View>

        {/* Stock Status */}
        <Card style={styles.stockStatusCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>Stock Status</ThemedText>
              <Button
                mode="text"
                onPress={() => router.push('./inventory')}
                compact
              >
                View All
              </Button>
            </View>

            <View style={styles.stockStatusItem}>
              <View style={styles.stockStatusHeader}>
                <ThemedText>Low Stock Items</ThemedText>
                <ThemedText>{lowStockPercentage}%</ThemedText>
              </View>
              <ProgressBar
                progress={lowStockPercentage / 100}
                color="#FF9500"
                style={styles.progressBar}
              />
            </View>

            <View style={styles.stockStatusItem}>
              <View style={styles.stockStatusHeader}>
                <ThemedText>Out of Stock Items</ThemedText>
                <ThemedText>{summary.outOfStockItems}</ThemedText>
              </View>
              <Button
                mode="outlined"
                onPress={() => router.push('./inventory?filter=outOfStock')}
                style={styles.stockButton}
                icon="alert"
              >
                Manage Out of Stock
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Stock Movements */}
        <Card style={styles.movementsCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>
                Recent Stock Movements
              </ThemedText>
              <Button
                mode="text"
                onPress={() => router.push('./inventory/movements')}
                compact
              >
                All Movements
              </Button>
            </View>

            {summary.recentMovements.length === 0 ? (
              <ThemedText style={styles.emptyState}>
                No recent movements
              </ThemedText>
            ) : (
              summary.recentMovements.slice(0, 5).map((movement: any) => (
                <View key={movement.id} style={styles.movementItem}>
                  <View style={styles.movementIcon}>
                    <IconSymbol
                      name={getMovementTypeIcon(movement.type)}
                      size={16}
                      color={
                        movement.type === 'IN'
                          ? '#34C759'
                          : movement.type === 'OUT'
                          ? '#FF3B30'
                          : '#007AFF'
                      }
                    />
                  </View>
                  <View style={styles.movementDetails}>
                    <ThemedText style={styles.movementTitle}>
                      {movement.itemName}
                    </ThemedText>
                    <ThemedText style={styles.movementSubtitle}>
                      {movement.type === 'IN'
                        ? `+${movement.quantity} added`
                        : movement.type === 'OUT'
                        ? `-${movement.quantity} removed`
                        : `${movement.quantity} adjusted`}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.movementDate}>
                    {formatDate(movement.createdAt)}
                  </ThemedText>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Top Selling Items */}
        {summary.topSellingItems.length > 0 && (
          <Card style={styles.topItemsCard}>
            <Card.Content>
              <ThemedText style={styles.cardTitle}>
                Top Selling Items
              </ThemedText>
              {summary.topSellingItems
                .slice(0, 5)
                .map((item: any, index: number) => (
                  <View key={item.id} style={styles.topItemRow}>
                    <ThemedText style={styles.topItemRank}>
                      #{index + 1}
                    </ThemedText>
                    <ThemedText style={styles.topItemName}>
                      {item.name}
                    </ThemedText>
                    <ThemedText style={styles.topItemValue}>
                      {item.quantitySold} sold
                    </ThemedText>
                  </View>
                ))}
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => router.push('./inventory/create')}
            style={styles.actionButton}
          >
            Add New Item
          </Button>
          <Button
            mode="outlined"
            icon="map-marker"
            onPress={() => router.push('./inventory/locations')}
            style={styles.actionButton}
          >
            Manage Locations
          </Button>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 3;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryCard: {
    width: cardWidth,
    borderRadius: 8,
  },
  totalItemsCard: {
    backgroundColor: Colors.light.tint + '10',
  },
  stockCard: {
    backgroundColor: '#FF950010',
  },
  valueCard: {
    backgroundColor: '#34C75910',
  },
  summaryCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  stockStatusCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stockStatusItem: {
    marginBottom: 16,
  },
  stockStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  stockButton: {
    marginTop: 8,
  },
  movementsCard: {
    marginBottom: 16,
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  movementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movementDetails: {
    flex: 1,
  },
  movementTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  movementSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  movementDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  topItemsCard: {
    marginBottom: 16,
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  topItemRank: {
    width: 32,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  topItemName: {
    flex: 1,
  },
  topItemValue: {
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyState: {
    textAlign: 'center',
    padding: 16,
    opacity: 0.6,
  },
});
