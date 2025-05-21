import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import {
  Button,
  Card,
  Divider,
  TextInput,
  RadioButton,
} from 'react-native-paper';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { gql, useMutation, useQuery } from '@apollo/client';

const GET_PRODUCT_BY_BARCODE = gql`
  query GetProductByBarcode($barcode: String!) {
    productByBarcode(barcode: $barcode) {
      id
      name
      sku
      barcode
      quantity
      unitPrice
      category
      description
    }
  }
`;

const RECORD_INVENTORY_TRANSACTION = gql`
  mutation RecordInventoryTransaction(
    $barcode: String!
    $quantity: Float!
    $transactionType: String!
    $locationId: String!
    $notes: String
  ) {
    recordScanTransaction(
      barcode: $barcode
      quantity: $quantity
      transactionType: $transactionType
      locationId: $locationId
      notes: $notes
    ) {
      id
      transactionType
      quantity
      createdAt
      product {
        id
        name
        quantity
      }
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

type ScanResultProps = {
  barcode: string;
  onClose: () => void;
  onScanAgain: () => void;
};

export function BarcodeScanResult({
  barcode,
  onClose,
  onScanAgain,
}: ScanResultProps) {
  const colorScheme = useColorScheme();
  const [quantity, setQuantity] = useState('1');
  const [transactionType, setTransactionType] = useState('STOCK_RECEIPT');
  const [locationId, setLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Get product details by barcode
  const { data: productData, loading: productLoading } = useQuery(
    GET_PRODUCT_BY_BARCODE,
    {
      variables: { barcode },
      fetchPolicy: 'network-only',
    }
  );

  // Get available locations
  const { data: locationsData } = useQuery(GET_LOCATIONS);
  const locations = locationsData?.locations || [];

  // Set up mutation for recording transaction
  const [recordTransaction, { loading: mutationLoading }] = useMutation(
    RECORD_INVENTORY_TRANSACTION
  );

  const product = productData?.productByBarcode;

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      setError('');

      if (!locationId) {
        setError('Please select a location');
        setIsProcessing(false);
        return;
      }

      const parsedQuantity = parseFloat(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        setError('Please enter a valid quantity');
        setIsProcessing(false);
        return;
      }

      // For outgoing transactions, check if there's enough stock
      if (
        transactionType === 'SALE' ||
        (transactionType === 'STOCK_ADJUSTMENT' && parsedQuantity < 0)
      ) {
        if (product && product.quantity < parsedQuantity) {
          setError('Not enough stock available');
          setIsProcessing(false);
          return;
        }
      }

      const response = await recordTransaction({
        variables: {
          barcode,
          quantity: parsedQuantity,
          transactionType,
          locationId,
          notes: notes || undefined,
        },
      });

      setSuccess(true);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(err.message || 'An error occurred processing the transaction');
      setIsProcessing(false);
    }
  };

  if (productLoading) {
    return (
      <ThemedView style={styles.container}>
        <Card style={styles.card}>
          <Card.Title title="Loading Product Information" />
          <Card.Content>
            <ThemedText>Looking up barcode: {barcode}</ThemedText>
          </Card.Content>
        </Card>
      </ThemedView>
    );
  }

  if (!product && !productLoading) {
    return (
      <ThemedView style={styles.container}>
        <Card style={styles.card}>
          <Card.Title
            title="Product Not Found"
            left={(props) => (
              <IconSymbol
                name="exclamationmark.triangle"
                size={24}
                color={Colors[colorScheme ?? 'light'].tint}
              />
            )}
          />
          <Card.Content>
            <ThemedText>No product found with barcode: {barcode}</ThemedText>
            <ThemedText style={styles.helperText}>
              Would you like to add this product to inventory?
            </ThemedText>
          </Card.Content>
          <Card.Actions>
            <Button onPress={onScanAgain}>Scan Again</Button>
            <Button
              mode="contained"
              onPress={() => {
                // Navigate to add product screen with pre-filled barcode
                onClose();
                // Navigation logic would go here
              }}
            >
              Add Product
            </Button>
          </Card.Actions>
        </Card>
      </ThemedView>
    );
  }

  if (success) {
    return (
      <ThemedView style={styles.container}>
        <Card style={styles.card}>
          <Card.Title
            title="Transaction Complete"
            left={(props) => (
              <IconSymbol
                name="checkmark.circle"
                size={24}
                color={Colors[colorScheme ?? 'light'].success}
              />
            )}
          />
          <Card.Content>
            <ThemedText style={styles.successText}>
              {transactionType === 'STOCK_RECEIPT'
                ? 'Stock added successfully'
                : transactionType === 'SALE'
                ? 'Sale recorded successfully'
                : 'Stock adjusted successfully'}
            </ThemedText>
            <View style={styles.productInfo}>
              <ThemedText style={styles.productName}>{product.name}</ThemedText>
              <ThemedText>SKU: {product.sku}</ThemedText>
              <ThemedText>
                New Quantity:{' '}
                {transactionType === 'STOCK_RECEIPT'
                  ? product.quantity + parseFloat(quantity)
                  : transactionType === 'SALE'
                  ? product.quantity - parseFloat(quantity)
                  : transactionType === 'STOCK_ADJUSTMENT' &&
                    parseFloat(quantity) < 0
                  ? product.quantity - Math.abs(parseFloat(quantity))
                  : product.quantity + parseFloat(quantity)}
              </ThemedText>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button onPress={onScanAgain}>Scan Another</Button>
            <Button mode="contained" onPress={onClose}>
              Done
            </Button>
          </Card.Actions>
        </Card>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Process Item" subtitle={`Barcode: ${barcode}`} />
        <Card.Content>
          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          <View style={styles.productInfo}>
            <ThemedText style={styles.productName}>{product.name}</ThemedText>
            <ThemedText>SKU: {product.sku}</ThemedText>
            <ThemedText>Current Stock: {product.quantity}</ThemedText>
            <ThemedText>Unit Price: ${product.unitPrice.toFixed(2)}</ThemedText>
          </View>

          <Divider style={styles.divider} />

          <RadioButton.Group
            onValueChange={(value) => setTransactionType(value)}
            value={transactionType}
          >
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Receive Stock"
                value="STOCK_RECEIPT"
                labelStyle={styles.radioLabel}
              />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Record Sale"
                value="SALE"
                labelStyle={styles.radioLabel}
              />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Adjust Stock"
                value="STOCK_ADJUSTMENT"
                labelStyle={styles.radioLabel}
              />
            </View>
          </RadioButton.Group>

          <TextInput
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />

          {locations.length > 0 ? (
            <TextInput
              label="Location"
              value={locationId}
              onChangeText={setLocationId}
              style={styles.input}
              mode="outlined"
              // In a real app, this would be a dropdown selector
              placeholder="Select a location"
            />
          ) : null}

          <TextInput
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
            mode="outlined"
            multiline
          />
        </Card.Content>
        <Card.Actions>
          <Button onPress={onScanAgain}>Scan Again</Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isProcessing}
            disabled={isProcessing}
          >
            Process
          </Button>
        </Card.Actions>
      </Card>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
  },
  productInfo: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
  },
  successText: {
    color: Colors.light.success,
    fontSize: 16,
    marginBottom: 8,
  },
  helperText: {
    marginTop: 16,
    marginBottom: 8,
  },
});
