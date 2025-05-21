import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestContext,
  BaseContext,
  GraphQLRequestExecutionListener,
  GraphQLRequestContextExecutionDidStart,
  GraphQLRequestListenerDidResolveField,
} from 'apollo-server-plugin-base';

interface GraphQLFieldResolverParams<TSource = any, TContext = any> {
  source: TSource;
  args: Record<string, any>;
  context: TContext;
  info: GraphQLResolveInfo;
}
import { TenantCache } from '../services/cache.service';
import { CacheType } from '../services/cache.service';
import {
  OperationDefinitionNode,
  DocumentNode,
  GraphQLResolveInfo,
} from 'graphql';

// Cache configuration by operation
interface CacheConfig {
  ttl: CacheType;
  invalidatedBy: string[]; // List of mutation names that should invalidate this cache
}

const CACHE_CONFIG: Record<string, CacheConfig> = {
  products: {
    ttl: CacheType.VOLATILE,
    invalidatedBy: [
      'createProduct',
      'updateProduct',
      'deleteProduct',
      'stockReceipt',
      'stockAdjustment',
      'transferStock',
      'recordSale',
    ],
  },
  categories: {
    ttl: CacheType.STANDARD,
    invalidatedBy: ['createCategory', 'updateCategory', 'deleteCategory'],
  },
  brands: {
    ttl: CacheType.STANDARD,
    invalidatedBy: ['createBrand', 'updateBrand', 'deleteBrand'],
  },
  locations: {
    ttl: CacheType.STANDARD,
    invalidatedBy: ['createLocation', 'updateLocation', 'deleteLocation'],
  },
  inventoryValueReport: {
    ttl: CacheType.VOLATILE,
    invalidatedBy: [
      'stockReceipt',
      'stockAdjustment',
      'transferStock',
      'recordSale',
    ],
  },
  productStockLevels: {
    ttl: CacheType.VOLATILE,
    invalidatedBy: [
      'stockReceipt',
      'stockAdjustment',
      'transferStock',
      'recordSale',
    ],
  },
};

// Set of cacheable operations for quick lookup
const CACHEABLE_OPERATIONS = new Set(Object.keys(CACHE_CONFIG));

export const createCachePlugin = (): ApolloServerPlugin => {
  return {
    async requestDidStart(
      requestContext: GraphQLRequestContext<BaseContext>
    ): Promise<GraphQLRequestListener<BaseContext>> {
      const tenant = requestContext.context.tenant;
      let cache: TenantCache | null = null;

      if (tenant) {
        cache = new TenantCache(tenant.id);
      }

      const getOperationMetadata = (document?: DocumentNode) => {
        if (!document) return null;

        const operationDef = document.definitions.find(
          (def) => def.kind === 'OperationDefinition'
        ) as OperationDefinitionNode;

        if (!operationDef || !operationDef.name) {
          return null;
        }

        return {
          type: operationDef.operation,
          name: operationDef.name.value,
        };
      };

      return {
        async willSendResponse(requestContext) {
          if (!cache || !tenant || requestContext.response.errors) {
            return;
          }

          const operation = getOperationMetadata(requestContext.document);
          if (!operation || operation.type !== 'query') {
            return;
          }

          const config = CACHE_CONFIG[operation.name];
          if (!config) {
            return;
          }

          try {
            const variables = requestContext.request.variables || {};
            await cache.cacheGraphQLQuery(
              operation.name,
              variables,
              requestContext.response.data,
              config.ttl
            );
          } catch (error) {
            console.error('Failed to cache GraphQL response:', error);
          }
        },

        async executionDidStart(): Promise<
          GraphQLRequestExecutionListener<BaseContext>
        > {
          return {
            willResolveField(
              fieldResolverParams: GraphQLFieldResolverParams<any, BaseContext>
            ): void {
              const { info, args, context } = fieldResolverParams;

              // Only handle queries with tenant context
              if (info.operation.operation !== 'query' || !context.tenant) {
                return;
              }

              const operationName = info.operation.name?.value;

              // Only check cache for cacheable operations
              if (!operationName || !CACHEABLE_OPERATIONS.has(operationName)) {
                return;
              }

              // We'll let the resolver handle the actual resolution
              // The caching is handled in willSendResponse
              return;
            },
          };
        },
      };
    },
  };
};
