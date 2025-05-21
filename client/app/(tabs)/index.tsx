import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLanguage } from '@/hooks/useLanguage';
import { InventoryDashboard } from '@/components/inventory/InventoryDashboard';
import { Card, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Ventory Dashboard</ThemedText>
        <HelloWave />
      </ThemedView>

      <InventoryDashboard />

      <Card style={styles.quickActionsCard}>
        <Card.Content>
          <ThemedText style={styles.cardTitle}>Quick Actions</ThemedText>
          <ThemedView style={styles.actionsGrid}>
            <ThemedView
              style={styles.actionItem}
              onTouchEnd={() => router.push('./inventory')}
            >
              <IconSymbol
                name="cube.box.fill"
                size={24}
                color={Colors.light.tint}
              />
              <ThemedText style={styles.actionText}>Inventory</ThemedText>
            </ThemedView>

            <ThemedView
              style={styles.actionItem}
              onTouchEnd={() => router.push('./inventory/create')}
            >
              <IconSymbol name="plus.circle.fill" size={24} color="#34C759" />
              <ThemedText style={styles.actionText}>Add Item</ThemedText>
            </ThemedView>

            <ThemedView
              style={styles.actionItem}
              onTouchEnd={() => router.push('./inventory/movements')}
            >
              <IconSymbol
                name="arrow.up.arrow.down"
                size={24}
                color="#FF9500"
              />
              <ThemedText style={styles.actionText}>Movements</ThemedText>
            </ThemedView>

            <ThemedView
              style={styles.actionItem}
              onTouchEnd={() => router.push('./inventory/locations')}
            >
              <IconSymbol name="mappin.and.ellipse" size={24} color="#5856D6" />
              <ThemedText style={styles.actionText}>Locations</ThemedText>
            </ThemedView>
          </ThemedView>
        </Card.Content>
      </Card>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">{t('home.step3Title')}</ThemedText>
        <ThemedText>
          {t('home.step3Text', {
            command: (
              <ThemedText type="defaultSemiBold">
                npm run reset-project
              </ThemedText>
            ),
            appDir: <ThemedText type="defaultSemiBold">app</ThemedText>,
            exampleDir: (
              <ThemedText type="defaultSemiBold">app-example</ThemedText>
            ),
          })}
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  quickActionsCard: {
    marginHorizontal: 16,
    marginBottom: 32,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionText: {
    marginTop: 8,
    fontWeight: '500',
  },
});
