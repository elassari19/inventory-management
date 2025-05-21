import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { IconSymbol } from '../ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Collapsible } from '../Collapsible';
import { format } from 'date-fns';
import { StockMovement } from './StockMovement';
import {
  StockMovementHistory,
  StockMovementRecord,
} from './StockMovementHistory';
// Define a simple button component since there's no existing one
function Button({
  onPress,
  title,
  disabled,
  variant = 'primary',
}: {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        buttonStyles.button,
        variant === 'primary' ? buttonStyles.primary : buttonStyles.secondary,
        disabled && buttonStyles.disabled,
      ]}
    >
      <Text
        style={[
          buttonStyles.text,
          variant === 'secondary' && buttonStyles.secondaryText,
          disabled && buttonStyles.disabledText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const buttonStyles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.light.tint,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: Colors.light.tint,
  },
  disabledText: {
    color: '#fff',
  },
});

interface ItemDetailsProps {
  item: {
    id: string;
    name: string;
    sku: string;
    description?: string;
    quantity: number;
    minQuantity?: number;
    maxQuantity?: number;
    unitPrice: number;
    location?: string;
    barcode?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
  };
  movements?: StockMovementRecord[];
  onMovement?: (data: {
    type: 'IN' | 'OUT' | 'ADJUST';
    quantity: number;
    reason: string;
    location?: string;
    destinationLocation?: string;
  }) => Promise<void>;
  onRefreshMovements?: () => void;
  isLoadingMovements?: boolean;
}

export function ItemDetails({
  item,
  movements = [],
  onMovement,
  onRefreshMovements,
  isLoadingMovements,
}: ItemDetailsProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const [showMovementForm, setShowMovementForm] = useState(false);

  // Calculate reorder status
  let reorderStatus = '';
  if (item.minQuantity !== undefined) {
    if (item.quantity <= item.minQuantity) {
      reorderStatus = 'Below minimum';
    }
  }
  if (item.maxQuantity !== undefined && item.quantity >= item.maxQuantity) {
    reorderStatus = 'Above maximum';
  }

  return (
    <ScrollView>
      <ThemedView style={styles.header}>
        <View style={styles.titleContainer}>
          <IconSymbol
            name="bolt.fill"
            size={24}
            color={Colors[colorScheme].text}
          />
          <ThemedText style={styles.title}>{item.name}</ThemedText>
        </View>
        <ThemedText style={styles.sku}>SKU: {item.sku}</ThemedText>
      </ThemedView>

      <Collapsible title="Stock Information">
        <ThemedView style={styles.detailsGrid}>
          <DetailItem label="Current Stock" value={item.quantity.toString()} />
          {item.minQuantity !== undefined && (
            <DetailItem
              label="Min Quantity"
              value={item.minQuantity.toString()}
            />
          )}
          {item.maxQuantity !== undefined && (
            <DetailItem
              label="Max Quantity"
              value={item.maxQuantity.toString()}
            />
          )}
          {reorderStatus && (
            <DetailItem
              label="Status"
              value={reorderStatus}
              valueStyle={[
                styles.status,
                {
                  color:
                    reorderStatus === 'Below minimum' ? '#FF0000' : '#FF9900',
                },
              ]}
            />
          )}
        </ThemedView>

        {onMovement && (
          <ThemedView style={styles.actions}>
            <Button
              title={showMovementForm ? 'Cancel Movement' : 'Record Movement'}
              onPress={() => setShowMovementForm(!showMovementForm)}
              variant={showMovementForm ? 'secondary' : 'primary'}
            />
          </ThemedView>
        )}

        {showMovementForm && onMovement && (
          <StockMovement
            itemId={item.id}
            currentQuantity={item.quantity}
            onSubmit={async (data) => {
              await onMovement(data);
              setShowMovementForm(false);
            }}
          />
        )}
      </Collapsible>

      <Collapsible title="Product Details">
        <ThemedView style={styles.detailsGrid}>
          {item.description && (
            <DetailItem
              label="Description"
              value={item.description}
              fullWidth
            />
          )}
          <DetailItem
            label="Unit Price"
            value={item.unitPrice.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          />
          {item.location && (
            <DetailItem label="Location" value={item.location} />
          )}
          {item.barcode && <DetailItem label="Barcode" value={item.barcode} />}
          {item.tags && item.tags.length > 0 && (
            <DetailItem label="Tags" value={item.tags.join(', ')} fullWidth />
          )}
        </ThemedView>
      </Collapsible>

      <Collapsible title="Stock Movement History">
        <StockMovementHistory
          movements={movements}
          isLoading={isLoadingMovements}
          onRefresh={onRefreshMovements}
        />
      </Collapsible>

      <ThemedView style={styles.timestamps}>
        <ThemedText style={styles.timestamp}>
          Created: {format(new Date(item.createdAt), 'PP')}
        </ThemedText>
        <ThemedText style={styles.timestamp}>
          Last Updated: {format(new Date(item.updatedAt), 'PP')}
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
  valueStyle?: any;
  fullWidth?: boolean;
}

function DetailItem({ label, value, valueStyle, fullWidth }: DetailItemProps) {
  return (
    <ThemedView style={[styles.detailItem, fullWidth && styles.fullWidth]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={[styles.value, valueStyle]}>{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sku: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 32,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 8,
  },
  detailItem: {
    width: '45%',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
  },
  status: {
    fontWeight: '600',
  },
  timestamps: {
    marginTop: 24,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.5,
  },
  actions: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
});
