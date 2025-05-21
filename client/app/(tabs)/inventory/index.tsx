import { FlatList, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { InventoryListItem } from '@/components/inventory/InventoryListItem';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useDebounce } from '@/hooks/useDebounce';
import { useState, useCallback, useEffect } from 'react';
import {
  Searchbar,
  FAB,
  Chip,
  Button,
  Menu,
  Divider,
} from 'react-native-paper';
import { ThemedText } from '../../../components/ThemedText';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Colors } from '../../../constants/Colors';

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
    }
  }
`;

export default function InventoryScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const { items, loading, refetch, loadMore, setSearch } = useInventoryItems(
    debouncedSearch,
    selectedCategory
  );

  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const categories = categoriesData?.categories || [];

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      setSearch(text);
    },
    [setSearch]
  );

  const handleEndReached = useCallback(() => {
    if (!loading) {
      loadMore();
    }
  }, [loading, loadMore]);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setMenuVisible(false);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search inventory..."
          value={searchText}
          onChangeText={handleSearch}
          style={styles.searchBar}
        />
        <Button
          icon="filter"
          mode="outlined"
          onPress={() => setMenuVisible(true)}
          style={styles.filterButton}
        >
          Filter
        </Button>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={{ x: 0, y: 0 }}
          style={styles.menu}
        >
          <Menu.Item
            onPress={() => handleCategorySelect(null)}
            title="All Categories"
          />
          <Divider />
          {categories.map((category: any) => (
            <Menu.Item
              key={category.id}
              onPress={() => handleCategorySelect(category.id)}
              title={category.name}
            />
          ))}
        </Menu>
      </View>

      {selectedCategory && (
        <View style={styles.activeFilters}>
          <Chip
            icon="tag"
            onClose={() => setSelectedCategory(null)}
            style={styles.filterChip}
          >
            {getCategoryName(selectedCategory)}
          </Chip>
        </View>
      )}

      <FlatList
        data={items}
        renderItem={({ item }) => (
          <InventoryListItem
            item={item}
            onPress={() => router.push(`./inventory/${item.id}`)}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={refetch}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator style={styles.loading} /> : null
        }
        ListEmptyComponent={
          !loading ? (
            <ThemedView style={styles.emptyState}>
              <IconSymbol name="cube.box" size={48} color="#ccc" />
              <ThemedText style={styles.emptyStateText}>
                No inventory items found
              </ThemedText>
              <Button
                mode="contained"
                onPress={() => router.push('./inventory/create')}
                icon="plus"
              >
                Add New Item
              </Button>
            </ThemedView>
          ) : null
        }
        contentContainerStyle={
          items.length === 0 ? styles.emptyContainer : { paddingBottom: 16 }
        }
        keyboardShouldPersistTaps="handled"
        style={{ flexGrow: 1 }}
        nestedScrollEnabled
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('./inventory/create')}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
  },
  filterButton: {
    borderColor: Colors.light.border,
  },
  menu: {
    marginTop: 40,
    marginLeft: 16,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: Colors.light.background,
  },
  loading: {
    marginVertical: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.tint,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
