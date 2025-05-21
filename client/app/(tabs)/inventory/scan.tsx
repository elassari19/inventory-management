import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { StatusBar } from 'expo-status-bar';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { BarcodeScanResult } from '@/components/scanner/BarcodeScanResult';
import { router } from 'expo-router';
import { Button, Card } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type BarcodeResult = {
  type: string;
  data: string;
};

enum ScanState {
  INITIAL = 'initial',
  SCANNING = 'scanning',
  RESULT = 'result',
}

export default function ScanScreen() {
  const [scanState, setScanState] = useState<ScanState>(ScanState.INITIAL);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const handleScan = (result: BarcodeResult) => {
    setScannedBarcode(result.data);
    setScanState(ScanState.RESULT);
  };

  const handleClose = () => {
    router.replace('./inventory');
  };

  const handleScanAgain = () => {
    setScannedBarcode(null);
    setScanState(ScanState.SCANNING);
  };

  const startScanning = () => {
    setScanState(ScanState.SCANNING);
  };

  switch (scanState) {
    case ScanState.SCANNING:
      return <BarcodeScanner onScan={handleScan} onClose={handleClose} />;

    case ScanState.RESULT:
      return (
        <BarcodeScanResult
          barcode={scannedBarcode || ''}
          onClose={handleClose}
          onScanAgain={handleScanAgain}
        />
      );

    case ScanState.INITIAL:
    default:
      return (
        <ThemedView style={styles.container}>
          <StatusBar style="auto" />
          <Card style={styles.card}>
            <Card.Title
              title="Inventory Scanner"
              subtitle="Scan barcodes and QR codes to manage inventory"
              left={(props) => (
                <IconSymbol
                  name="barcode.viewfinder"
                  size={32}
                  color={Colors[colorScheme ?? 'light'].tint}
                />
              )}
            />
            <Card.Content>
              <ThemedText style={styles.infoText}>
                Use this scanner to:
              </ThemedText>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <IconSymbol
                    name="arrow.down.to.line"
                    size={16}
                    color={Colors[colorScheme ?? 'light'].tint}
                  />
                  <ThemedText style={styles.featureText}>
                    Receive inventory
                  </ThemedText>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    name="arrow.up.right"
                    size={16}
                    color={Colors[colorScheme ?? 'light'].tint}
                  />
                  <ThemedText style={styles.featureText}>
                    Record sales
                  </ThemedText>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    name="slider.horizontal.3"
                    size={16}
                    color={Colors[colorScheme ?? 'light'].tint}
                  />
                  <ThemedText style={styles.featureText}>
                    Adjust quantities
                  </ThemedText>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    name="square.on.square"
                    size={16}
                    color={Colors[colorScheme ?? 'light'].tint}
                  />
                  <ThemedText style={styles.featureText}>
                    Look up product details
                  </ThemedText>
                </View>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button onPress={handleClose}>Cancel</Button>
              <Button mode="contained" onPress={startScanning}>
                Start Scanning
              </Button>
            </Card.Actions>
          </Card>
        </ThemedView>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 500,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 12,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 15,
  },
});
