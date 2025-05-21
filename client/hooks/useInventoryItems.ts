import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

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

  const { data, loading, error, refetch, fetchMore } = useQuery(
    GET_INVENTORY_ITEMS,
    {
      variables: {
        search,
        category,
        offset: 0,
        limit: 20,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const loadMore = async () => {
    if (!data?.inventoryItems) return;

    await fetchMore({
      variables: {
        offset: data.inventoryItems.length,
        limit: 20,
      },
    });
  };

  return {
    items: data?.inventoryItems || [],
    loading,
    error,
    refetch,
    loadMore,
    setSearch,
    setCategory,
  };
}
