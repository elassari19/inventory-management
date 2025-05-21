import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Colors } from '@/constants/Colors';
import { format } from 'date-fns';

export interface StockMovementRecord {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER' | 'SALE';
  quantity: number;
  reason?: string;
  performedBy?: string;
  sourceLocation?: string;
  destinationLocation?: string;
  createdAt: string;
}

interface Props {
  movements: StockMovementRecord[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function StockMovementHistory({
  movements,
  isLoading,
  onRefresh,
}: Props) {
  const getTypeIcon = (type: StockMovementRecord['type']) => {
    switch (type) {
      case 'IN':
        return '→';
      case 'OUT':
        return '←';
      case 'ADJUST':
        return '⇄';
      case 'TRANSFER':
        return '⇌';
      case 'SALE':
        return '↗';
    }
  };

  const getTypeLabel = (type: StockMovementRecord['type']) => {
    switch (type) {
      case 'IN':
        return 'Stock Receipt';
      case 'OUT':
        return 'Stock Out';
      case 'ADJUST':
        return 'Adjustment';
      case 'TRANSFER':
        return 'Transfer';
      case 'SALE':
        return 'Sale';
    }
  };

  return (
    <ScrollView
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!isLoading} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      <ThemedView style={styles.container}>
        {movements.map((movement) => (
          <ThemedView key={movement.id} style={styles.movementCard}>
            <View style={styles.header}>
              <View style={styles.typeContainer}>
                <ThemedText style={styles.typeIcon}>
                  {getTypeIcon(movement.type)}
                </ThemedText>
                <ThemedText style={styles.type}>
                  {getTypeLabel(movement.type)}
                </ThemedText>
              </View>
              <ThemedText style={styles.date}>
                {format(new Date(movement.createdAt), 'PP')}
              </ThemedText>
            </View>

            <View style={styles.details}>
              <ThemedText style={styles.quantity}>
                {movement.type === 'OUT' || movement.type === 'SALE' ? '-' : ''}
                {movement.quantity}
              </ThemedText>

              {movement.reason && (
                <ThemedText style={styles.reason}>{movement.reason}</ThemedText>
              )}

              {movement.type === 'TRANSFER' && (
                <ThemedText style={styles.location}>
                  {movement.sourceLocation} → {movement.destinationLocation}
                </ThemedText>
              )}

              {movement.performedBy && (
                <ThemedText style={styles.performedBy}>
                  By: {movement.performedBy}
                </ThemedText>
              )}
            </View>
          </ThemedView>
        ))}

        {movements.length === 0 && (
          <ThemedText style={styles.emptyText}>
            No stock movements recorded
          </ThemedText>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  movementCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    fontSize: 18,
  },
  type: {
    fontSize: 16,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
  },
  details: {
    gap: 4,
  },
  quantity: {
    fontSize: 18,
    fontWeight: '600',
  },
  reason: {
    fontSize: 14,
    opacity: 0.8,
  },
  location: {
    fontSize: 14,
    opacity: 0.8,
  },
  performedBy: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    padding: 24,
  },
});
