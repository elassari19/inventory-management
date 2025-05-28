import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useOfflineData } from './useOfflineData';
import { useSyncQueue } from '@/services/sync.service';

const GET_INVENTORY_ITEMS = gql`
  query GetInventoryItems(
    $search: String
    $category: String
    $offset: Int
    $limit: Int
  ) {
    inventoryItems(
      search: $search
      category: $category
      offset: $offset
      limit: $limit
    ) {
      id
      name
      quantity
      category
      location
      unitPrice
      sku
      createdAt
      updatedAt
    }
  }
`;

export function useInventoryItems(
  initialSearch = '',
  initialCategory: string | null = null
) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<string | null>(initialCategory);
  const { isOnline } = useSyncQueue();

  // GraphQL query for online mode
  const {
    data: onlineData,
    loading: onlineLoading,
    error,
    refetch: onlineRefetch,
    fetchMore: onlineFetchMore,
  } = useQuery(GET_INVENTORY_ITEMS, {
    variables: {
      search,
      category,
      offset: 0,
      limit: 20,
    },
    fetchPolicy: 'cache-and-network',
    skip: !isOnline, // Skip if offline
  });

  // Offline data using our offline hook
  const fetchInventoryItems = useCallback(async () => {
    // This would be called when we're online to get fresh data
    if (!isOnline) {
      return [];
    }

    try {
      const result = await onlineRefetch({
        search: '',
        category: null,
        offset: 0,
        limit: 500, // We want to cache more items for offline use
      });

      return result.data?.inventoryItems || [];
    } catch (error) {
      console.error('Error fetching inventory items for offline use:', error);
      return [];
    }
  }, [onlineRefetch, isOnline]);

  const {
    data: offlineData,
    status: offlineStatus,
    error: offlineError,
    isLoading: offlineLoading,
    isOffline: isWorkingOffline,
    addItem,
    updateItem,
    removeItem,
    refresh: offlineRefresh,
  } = useOfflineData({
    key: 'inventoryItems',
    fetchFn: fetchInventoryItems,
    idField: 'id',
  });

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  // Combine online and offline data
  const items = isOnline ? onlineData?.inventoryItems || [] : offlineData;
  const loading = isOnline ? onlineLoading : offlineLoading;

  // Apply search and category filters locally when offline
  const filteredItems = isWorkingOffline
    ? offlineData.filter((item: any) => {
        const matchesSearch =
          !search ||
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = !category || item.category === category;

        return matchesSearch && matchesCategory;
      })
    : items;

  useEffect(() => {
    // Refetch when search or category changes
    if (isOnline) {
      onlineRefetch({
        search,
        category,
        offset: 0,
        limit: 20,
      });
    }
  }, [search, category, isOnline, onlineRefetch]);

  const loadMore = useCallback(() => {
    if (!isOnline) return; // Don't attempt pagination when offline

    onlineFetchMore({
      variables: {
        offset: onlineData?.inventoryItems?.length || 0,
        limit: 20,
      },
    });
  }, [isOnline, onlineData?.inventoryItems?.length, onlineFetchMore]);

  const refetch = useCallback(() => {
    return isOnline ? onlineRefetch() : offlineRefresh();
  }, [isOnline, onlineRefetch, offlineRefresh]);

  return {
    items: filteredItems,
    loading,
    error: error || offlineError,
    refetch,
    loadMore,
    setSearch,
    setCategory,
    addItem,
    updateItem,
    removeItem,
    isOffline: isWorkingOffline,
  };
}
