import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { IconSymbol } from '../ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '../../constants/Colors';

interface InventoryItemProps {
  id: string;
  name: string;
  quantity: number;
  category: string;
  location?: string;
}

interface Props {
  item: InventoryItemProps;
  onPress: () => void;
}

export function InventoryListItem({ item, onPress }: Props) {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');

  return (
    <Pressable onPress={onPress}>
      <ThemedView style={[styles.container, { backgroundColor, borderColor }]}>
        <IconSymbol name="bolt.fill" size={24} color={Colors.light.text} />
        <ThemedView style={styles.details}>
          <ThemedText style={styles.name}>{item.name}</ThemedText>
          <ThemedText style={styles.category}>{item.category}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.quantity}>
          <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
          {item.location && (
            <ThemedText style={styles.location}>{item.location}</ThemedText>
          )}
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  category: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  quantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
  },
  location: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
});
