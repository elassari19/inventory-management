import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '../ui/IconSymbol';
import { Button, HelperText, TextInput, Menu } from 'react-native-paper';

interface Props {
  itemId: string;
  currentQuantity: number;
  onSubmit: (data: {
    type: 'IN' | 'OUT' | 'ADJUST';
    quantity: number;
    reason: string;
    location?: string;
    destinationLocation?: string;
  }) => Promise<void>;
}

type MovementType = 'IN' | 'OUT' | 'ADJUST';

export function StockMovement({ itemId, currentQuantity, onSubmit }: Props) {
  const [type, setType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!quantity || isNaN(Number(quantity))) {
      setError('Please enter a valid quantity');
      return;
    }

    const numericQuantity = Number(quantity);
    if (type === 'OUT' && numericQuantity > currentQuantity) {
      setError('Insufficient stock');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        type,
        quantity: numericQuantity,
        reason,
      });
      // Clear form
      setQuantity('');
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to record stock movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <IconSymbol
            name="tray.and.arrow.up.fill"
            color={Colors.light.icon}
            size={24}
          />
          <ThemedText style={styles.title}>Stock Movement</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Movement Type</ThemedText>
            <View>
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={styles.dropdown}
                icon="chevron-down"
                contentStyle={styles.dropdownContent}
              >
                {type === 'IN'
                  ? 'Stock In'
                  : type === 'OUT'
                  ? 'Stock Out'
                  : 'Adjust Stock'}
              </Button>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={{ x: 0, y: 0 }}
                style={styles.menu}
              >
                <Menu.Item
                  title="Stock In"
                  onPress={() => {
                    setType('IN');
                    setMenuVisible(false);
                  }}
                />
                <Menu.Item
                  title="Stock Out"
                  onPress={() => {
                    setType('OUT');
                    setMenuVisible(false);
                  }}
                />
                <Menu.Item
                  title="Adjust Stock"
                  onPress={() => {
                    setType('ADJUST');
                    setMenuVisible(false);
                  }}
                />
              </Menu>
            </View>
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Quantity</ThemedText>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
              mode="outlined"
            />
            {error && error.includes('quantity') && (
              <HelperText type="error">{error}</HelperText>
            )}
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Reason</ThemedText>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={setReason}
              placeholder="Enter reason for movement"
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </ThemedView>

          {error && !error.includes('quantity') && (
            <ThemedText style={styles.error}>{error}</ThemedText>
          )}

          <View style={styles.button}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !quantity || !reason}
            >
              {isSubmitting ? 'Recording...' : 'Record Movement'}
            </Button>
          </View>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'transparent',
  },
  textArea: {
    height: 100,
  },
  error: {
    color: Colors.light.error,
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    marginTop: 16,
  },
  dropdown: {
    width: '100%',
    marginBottom: 8,
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menu: {
    marginTop: 70,
  },
});
