import React, { useState } from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import {
  Button,
  Card,
  Menu,
  Divider,
  ActivityIndicator,
  Chip,
  Searchbar,
} from 'react-native-paper';
import { format } from 'date-fns';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useRouter } from 'expo-router';
import { useDebounce } from '@/hooks/useDebounce';
import { SFSymbol } from 'expo-symbols';

const GET_STOCK_MOVEMENTS = gql`
  query GetStockMovements(
    $search: String
    $type: String
    $limit: Int
    $offset: Int
  ) {
    stockMovements(
      search: $search
      type: $type
      limit: $limit
      offset: $offset
    ) {
      id
      type
      quantity
      reason
      itemId
      itemName
      itemSku
      performedBy
      sourceLocation
      destinationLocation
      createdAt
    }
  }
`;

export default function StockMovementsScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const { data, loading, error, fetchMore, refetch } = useQuery(
    GET_STOCK_MOVEMENTS,
    {
      variables: {
        search: debouncedSearch,
        type: selectedType,
        limit: 20,
        offset: 0,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

  const movements = data?.stockMovements || [];

  const handleEndReached = () => {
    if (!loading && movements.length > 0) {
      fetchMore({
        variables: {
          offset: movements.length,
          limit: 20,
        },
      });
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleFilterSelect = (type: string | null) => {
    setSelectedType(type);
    setFilterMenuVisible(false);
  };

  const getTypeInfo = (
    type: string
  ): { label: string; icon: SFSymbol; color: string } => {
    switch (type) {
      case 'IN':
        return {
          label: 'Stock In',
          icon: 'arrow.down',
          color: '#34C759',
        };
      case 'OUT':
        return {
          label: 'Stock Out',
          icon: 'arrow.up',
          color: '#FF3B30',
        };
      case 'ADJUST':
        return {
          label: 'Adjustment',
          icon: 'arrow.triangle.2.circlepath',
          color: '#007AFF',
        };
      case 'TRANSFER':
        return {
          label: 'Transfer',
          icon: 'arrow.right.arrow.left',
          color: '#5856D6',
        };
      default:
        return {
          label: 'Unknown',
          icon: 'questionmark.circle',
          color: '#8E8E93',
        };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const typeInfo = getTypeInfo(item.type);

    return (
      <Card style={styles.card} onPress={() => router.push(`./${item.itemId}`)}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.typeIconContainer,
                { backgroundColor: typeInfo.color + '20' },
              ]}
            >
              <IconSymbol
                name={typeInfo.icon}
                size={20}
                color={typeInfo.color}
              />
            </View>
            <View style={styles.cardTitleContainer}>
              <ThemedText style={styles.cardTitle}>{item.itemName}</ThemedText>
              <ThemedText style={styles.cardSubtitle}>
                SKU: {item.itemSku}
              </ThemedText>
            </View>
            <Chip
              mode="outlined"
              style={{ backgroundColor: typeInfo.color + '10' }}
            >
              {typeInfo.label}
            </Chip>
          </View>

          <View style={styles.quantityContainer}>
            <ThemedText style={[styles.quantity, { color: typeInfo.color }]}>
              {item.type === 'IN' ? '+' : item.type === 'OUT' ? '-' : '±'}
              {item.quantity}
            </ThemedText>
            <ThemedText style={styles.timestamp}>
              {format(new Date(item.createdAt), 'PPp')}
            </ThemedText>
          </View>

          {item.reason && (
            <ThemedText style={styles.reason}>{item.reason}</ThemedText>
          )}

          {item.type === 'TRANSFER' && (
            <ThemedText style={styles.location}>
              From {item.sourceLocation || 'Unknown'} to{' '}
              {item.destinationLocation || 'Unknown'}
            </ThemedText>
          )}

          {item.performedBy && (
            <ThemedText style={styles.performedBy}>
              By: {item.performedBy}
            </ThemedText>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol
          name="arrow.up.arrow.down"
          size={24}
          color={Colors.light.icon}
        />
        <ThemedText style={styles.title}>Stock Movements</ThemedText>
      </ThemedView>

      <View style={styles.filterContainer}>
        <Searchbar
          placeholder="Search movements..."
          value={searchText}
          onChangeText={handleSearch}
          style={styles.searchBar}
        />
        <Button
          icon="filter"
          mode="outlined"
          onPress={() => setFilterMenuVisible(true)}
          style={styles.filterButton}
        >
          Filter
        </Button>

        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={{ x: 0, y: 0 }}
          style={styles.menu}
        >
          <Menu.Item
            onPress={() => handleFilterSelect(null)}
            title="All Types"
          />
          <Divider />
          <Menu.Item
            onPress={() => handleFilterSelect('IN')}
            title="Stock In"
          />
          <Menu.Item
            onPress={() => handleFilterSelect('OUT')}
            title="Stock Out"
          />
          <Menu.Item
            onPress={() => handleFilterSelect('ADJUST')}
            title="Adjustments"
          />
          <Menu.Item
            onPress={() => handleFilterSelect('TRANSFER')}
            title="Transfers"
          />
        </Menu>
      </View>

      {selectedType && (
        <View style={styles.activeFilters}>
          <Chip
            icon={getTypeInfo(selectedType).icon}
            onClose={() => setSelectedType(null)}
            style={[
              styles.filterChip,
              { backgroundColor: getTypeInfo(selectedType).color + '10' },
            ]}
          >
            {getTypeInfo(selectedType).label}
          </Chip>
        </View>
      )}

      {loading && movements.length === 0 ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={movements}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
          refreshing={loading}
          onRefresh={refetch}
          ListFooterComponent={
            loading ? <ActivityIndicator style={styles.footerLoading} /> : null
          }
          ListEmptyComponent={
            <ThemedView style={styles.emptyState}>
              <IconSymbol name="clock" size={48} color="#ccc" />
              <ThemedText style={styles.emptyStateText}>
                No stock movements found
              </ThemedText>
            </ThemedView>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    height: 40,
  },
  filterButton: {
    borderColor: Colors.light.border,
  },
  menu: {
    marginTop: 40,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    borderRadius: 16,
  },
  loading: {
    marginTop: 40,
  },
  footerLoading: {
    marginVertical: 16,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 4,
    backgroundColor: Colors.light.cardBackground,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  reason: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  performedBy: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'right',
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    opacity: 0.7,
  },
});
