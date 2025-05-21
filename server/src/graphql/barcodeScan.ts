import { gql } from 'apollo-server-express';
import { InventoryService } from '../services/inventory.service';

export const typeDefs = gql`
  extend type Query {
    productByBarcode(barcode: String!): Product
  }

  extend type Mutation {
    recordScanTransaction(
      barcode: String!
      quantity: Float!
      transactionType: String!
      locationId: String!
      notes: String
    ): InventoryTransaction
  }

  type InventoryTransaction {
    id: ID!
    transactionType: String!
    quantity: Float!
    createdAt: String!
    product: Product
  }
`;

export const resolvers = {
  Query: {
    productByBarcode: async (_, { barcode }, { tenant }) => {
      if (!tenant || !tenant.id) {
        throw new Error('Authentication required');
      }

      try {
        const product = await InventoryService.findProductByBarcode(
          tenant.id,
          barcode
        );
        return product;
      } catch (error) {
        console.error('Error finding product by barcode:', error);
        throw error;
      }
    },
  },
  Mutation: {
    recordScanTransaction: async (
      _,
      { barcode, quantity, transactionType, locationId, notes },
      { tenant, user }
    ) => {
      if (!tenant || !tenant.id) {
        throw new Error('Authentication required');
      }

      try {
        const result = await InventoryService.scanProductBarcode(
          tenant.id,
          barcode,
          quantity,
          transactionType,
          locationId,
          notes,
          user?.id
        );

        return {
          id: result.transaction.id,
          transactionType: result.transaction.transaction_type,
          quantity: result.transaction.quantity,
          createdAt: result.transaction.created_at,
          product: result.product,
        };
      } catch (error) {
        console.error('Error recording scan transaction:', error);
        throw error;
      }
    },
  },
};
