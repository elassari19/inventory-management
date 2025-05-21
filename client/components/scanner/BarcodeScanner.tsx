import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Button } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import {
  CameraView,
  CameraType,
  BarcodeScanningResult,
  Camera,
  useCameraPermissions,
} from 'expo-camera';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Haptics from 'expo-haptics';

type BarcodeResult = {
  type: string;
  data: string;
};

type BarcodeScannerProps = {
  onScan: (result: BarcodeResult) => void;
  onClose: () => void;
};

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanned, setScanned] = useState(false);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    // Trigger haptic feedback when barcode is scanned
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onScan({ type: result.type, data: result.data });
  };

  if (permission === null) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'black' }]}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: [
            'aztec',
            'code128',
            'code39',
            'code93',
            'ean13',
            'ean8',
            'pdf417',
            'qr',
            'upc_e',
            'datamatrix',
            'itf14',
            'upc_a',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Scanner UI Overlay */}
        <View style={styles.overlayContainer}>
          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + 10 }]}
            onPress={onClose}
          >
            <IconSymbol size={24} name="xmark" color="white" />
          </TouchableOpacity>

          {/* Scan frame */}
          <View style={styles.scanFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionText}>
              Align barcode within the frame
            </Text>
          </View>

          {/* Scan again button */}
          {scanned && (
            <ThemedView style={styles.scanAgainButton}>
              <Button onPress={() => setScanned(false)} title="Scan Again" />
            </ThemedView>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  overlayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.light.tint,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.light.tint,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.light.tint,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.light.tint,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 50,
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
});
