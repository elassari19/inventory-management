import { gql } from '@apollo/client';

export const RECORD_STOCK_MOVEMENT = gql`
  mutation RecordStockMovement($input: StockMovementInput!) {
    recordStockMovement(input: $input) {
      id
      type
      quantity
      reason
      createdAt
      item {
        id
        quantity
      }
    }
  }
`;

export interface StockMovementInput {
  itemId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason: string;
  location?: string;
  destinationLocation?: string;
}
