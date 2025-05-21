import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useInventoryItem } from '@/hooks/useInventoryItem';
import { ItemDetails } from '@/components/inventory/ItemDetails';
import { StockMovement } from '@/components/inventory/StockMovement';
import { useMutation } from '@apollo/client';
import { RECORD_STOCK_MOVEMENT } from '@/graphql/stockMovement';

export default function InventoryItemScreen() {
  const { id } = useLocalSearchParams();
  const { item, loading, refetch } = useInventoryItem(id as string);
  const [recordStockMovement] = useMutation(RECORD_STOCK_MOVEMENT);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const handleStockMovement = async (data: {
    type: 'IN' | 'OUT' | 'ADJUST';
    quantity: number;
    reason: string;
    location?: string;
    destinationLocation?: string;
  }) => {
    try {
      await recordStockMovement({
        variables: {
          input: {
            itemId: id,
            ...data,
          },
        },
      });

      // Refetch the item to get updated quantity
      await refetch();

      Alert.alert('Success', 'Stock movement recorded successfully');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to record stock movement'
      );
      throw error; // Re-throw to let the StockMovement component handle the error state
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ItemDetails item={item} />
      <StockMovement
        itemId={id as string}
        currentQuantity={item?.quantity || 0}
        onSubmit={handleStockMovement}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
});
