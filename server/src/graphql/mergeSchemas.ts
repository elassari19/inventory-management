import { gql } from 'apollo-server-express';
import { typeDefs as coreTypeDefs } from './schema';
import { typeDefs as barcodeScanTypeDefs } from './barcodeScan';
import { typeDefs as notificationTypeDefs } from './notification';

// Merge the base schema with extensions
export const mergeTypeDefs = () => {
  // First, extract the Query and Mutation types from the core schema
  const coreSchemaStr = coreTypeDefs.loc?.source.body;

  // Create a base wrapper schema with placeholders for Query and Mutation
  const baseSchema = gql`
    # Base types maintained in schema.ts
    ${coreSchemaStr}

    # Barcode scanning extensions
    ${barcodeScanTypeDefs}

    # Notification system extensions
    ${notificationTypeDefs}
  `;

  return baseSchema;
};
