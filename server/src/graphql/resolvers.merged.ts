import { resolvers as baseResolvers } from './resolvers';
import { resolvers as barcodeScanResolvers } from './barcodeScan';

// Merge resolvers
export const mergedResolvers = {
  ...baseResolvers,
  Query: {
    ...baseResolvers.Query,
    ...barcodeScanResolvers.Query,
  },
  Mutation: {
    ...baseResolvers.Mutation,
    ...barcodeScanResolvers.Mutation,
  },
};
