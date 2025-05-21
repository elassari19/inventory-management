import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_INVENTORY_ITEM = gql`
  query GetInventoryItem($id: String!) {
    inventoryItem(id: $id) {
      id
      name
      quantity
      category
      sku
      location
      description
      unitPrice
      barcode
      tags
      createdAt
      updatedAt
    }
  }
`;

export function useInventoryItem(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_INVENTORY_ITEM, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });

  return {
    item: data?.inventoryItem || null,
    loading,
    error,
    refetch,
  };
}
