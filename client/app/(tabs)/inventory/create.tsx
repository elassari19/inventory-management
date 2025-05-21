import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TextInput } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';
import { Button, HelperText, SegmentedButtons } from 'react-native-paper';
import { Dropdown } from 'react-native-paper-dropdown';
import { useRouter } from 'expo-router';
import { gql, useMutation, useQuery } from '@apollo/client';

const CREATE_INVENTORY_ITEM = gql`
  mutation CreateInventoryItem($input: InventoryItemInput!) {
    createInventoryItem(input: $input) {
      id
      name
      sku
      category
      description
      quantity
      unitPrice
      location
      barcode
      tags
    }
  }
`;

const GET_LOCATIONS = gql`
  query GetLocations {
    locations {
      id
      name
    }
  }
`;

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
    }
  }
`;

export default function CreateInventoryItemScreen() {
  const router = useRouter();
  const [createItem, { loading }] = useMutation(CREATE_INVENTORY_ITEM);

  // Data state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [quantity, setQuantity] = useState('0');
  const [unitPrice, setUnitPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [tags, setTags] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [location, setLocation] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch locations and categories
  const { data: locationData } = useQuery(GET_LOCATIONS);
  const { data: categoryData } = useQuery(GET_CATEGORIES);

  const locationOptions =
    locationData?.locations?.map((loc: any) => ({
      label: loc.name,
      value: loc.id,
    })) || [];

  const categoryOptions =
    categoryData?.categories?.map((cat: any) => ({
      label: cat.name,
      value: cat.id,
    })) || [];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!sku.trim()) newErrors.sku = 'SKU is required';
    if (isNaN(Number(quantity)) || Number(quantity) < 0) {
      newErrors.quantity = 'Quantity must be a valid number';
    }
    if (unitPrice && (isNaN(Number(unitPrice)) || Number(unitPrice) < 0)) {
      newErrors.unitPrice = 'Unit price must be a valid number';
    }
    if (
      minQuantity &&
      (isNaN(Number(minQuantity)) || Number(minQuantity) < 0)
    ) {
      newErrors.minQuantity = 'Min quantity must be a valid number';
    }
    if (
      maxQuantity &&
      (isNaN(Number(maxQuantity)) || Number(maxQuantity) < 0)
    ) {
      newErrors.maxQuantity = 'Max quantity must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const result = await createItem({
        variables: {
          input: {
            name,
            sku,
            description: description || undefined,
            category: category || undefined,
            quantity: Number(quantity),
            unitPrice: unitPrice ? Number(unitPrice) : undefined,
            location: location || undefined,
            barcode: barcode || undefined,
            tags: tagsArray.length > 0 ? tagsArray : undefined,
            minQuantity: minQuantity ? Number(minQuantity) : undefined,
            maxQuantity: maxQuantity ? Number(maxQuantity) : undefined,
          },
        },
      });

      Alert.alert('Success', 'Inventory item created successfully');
      router.push(`./${result.data.createInventoryItem.id}`);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create item'
      );
    }
  };

  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <IconSymbol
            name="plus.circle.fill"
            size={24}
            color={Colors.light.icon}
          />
          <ThemedText style={styles.title}>New Inventory Item</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Item name"
              placeholderTextColor={Colors.light.text}
            />
            {errors.name && <HelperText type="error">{errors.name}</HelperText>}
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>SKU *</ThemedText>
            <TextInput
              style={styles.input}
              value={sku}
              onChangeText={setSku}
              placeholder="Stock keeping unit"
              placeholderTextColor={Colors.light.text}
            />
            {errors.sku && <HelperText type="error">{errors.sku}</HelperText>}
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Category</ThemedText>
            <View style={styles.input}>
              <Dropdown
                label="Select Category"
                mode="outlined"
                value={category}
                onSelect={() => setCategory(category)}
                options={categoryOptions}
              />
            </View>
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Item description"
              placeholderTextColor={Colors.light.text}
              multiline
              numberOfLines={3}
            />
          </ThemedView>

          <ThemedView style={styles.row}>
            <ThemedView style={[styles.field, styles.halfWidth]}>
              <ThemedText style={styles.label}>Initial Quantity *</ThemedText>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.light.text}
              />
              {errors.quantity && (
                <HelperText type="error">{errors.quantity}</HelperText>
              )}
            </ThemedView>

            <ThemedView style={[styles.field, styles.halfWidth]}>
              <ThemedText style={styles.label}>Unit Price</ThemedText>
              <TextInput
                style={styles.input}
                value={unitPrice}
                onChangeText={setUnitPrice}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={Colors.light.text}
              />
              {errors.unitPrice && (
                <HelperText type="error">{errors.unitPrice}</HelperText>
              )}
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.row}>
            <ThemedView style={[styles.field, styles.halfWidth]}>
              <ThemedText style={styles.label}>Min Quantity</ThemedText>
              <TextInput
                style={styles.input}
                value={minQuantity}
                onChangeText={setMinQuantity}
                keyboardType="numeric"
                placeholder="Reorder point"
                placeholderTextColor={Colors.light.text}
              />
              {errors.minQuantity && (
                <HelperText type="error">{errors.minQuantity}</HelperText>
              )}
            </ThemedView>

            <ThemedView style={[styles.field, styles.halfWidth]}>
              <ThemedText style={styles.label}>Max Quantity</ThemedText>
              <TextInput
                style={styles.input}
                value={maxQuantity}
                onChangeText={setMaxQuantity}
                keyboardType="numeric"
                placeholder="Maximum stock"
                placeholderTextColor={Colors.light.text}
              />
              {errors.maxQuantity && (
                <HelperText type="error">{errors.maxQuantity}</HelperText>
              )}
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Location</ThemedText>
            <View style={styles.input}>
              <Dropdown
                label="Select Location"
                mode="outlined"
                value={location}
                onSelect={() => setCategory(location)}
                options={locationOptions}
              />
            </View>
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Barcode</ThemedText>
            <TextInput
              style={styles.input}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Scan or enter barcode"
              placeholderTextColor={Colors.light.text}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Tags</ThemedText>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="Comma separated tags"
              placeholderTextColor={Colors.light.text}
            />
          </ThemedView>

          <View style={styles.buttons}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            >
              Create Item
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.cancelButton}
            >
              Cancel
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
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  dropdownInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttons: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    paddingVertical: 8,
  },
  cancelButton: {
    paddingVertical: 8,
  },
});
