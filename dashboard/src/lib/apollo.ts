import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  split,
  ApolloLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { store } from '../store';

// HTTP Link
const httpLink = createHttpLink({
  uri:
    `${import.meta.env.VITE_API_URL}${import.meta.env.VITE_GRAPHQL_ENDPOINT}` ||
    'http://localhost:3001/graphql',
  credentials: 'include',
});

// WebSocket Link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: import.meta.env.VITE_WS_URL
      ? `${import.meta.env.VITE_WS_URL}/graphql`
      : 'ws://localhost:3001/graphql',
    connectionParams: () => {
      const token = store.getState().auth.token;
      const tenantId =
        store.getState().tenant.currentTenant?.id ||
        localStorage.getItem('currentTenantId');
      return {
        authorization: token ? `Bearer ${token}` : '',
        'x-tenant-id': tenantId || '',
      };
    },
  })
);

// Auth Link - adds authentication headers
const authLink = setContext((_, { headers }) => {
  // Get the authentication token and tenant from Redux store
  const token = store.getState().auth.token;
  const tenantId =
    store.getState().tenant.currentTenant?.id ||
    localStorage.getItem('currentTenantId');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-tenant-id': tenantId || '',
    },
  };
});

// Error Link - handles GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // Handle authentication errors
      if (
        message.includes('Unauthorized') ||
        message.includes('Authentication')
      ) {
        // Dispatch logout action and redirect to login
        store.dispatch({ type: 'auth/logout' });
        window.location.href = '/login';
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // Handle authentication errors
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // Dispatch logout action and redirect to login
      store.dispatch({ type: 'auth/logout' });
      window.location.href = '/login';
    }
  }
});

// Retry Link - retries failed requests
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 5,
    retryIf: (error, _operation) => !!error,
  },
});

// Split link for HTTP vs WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  from([retryLink, errorLink, authLink, httpLink])
);

// Create the Apollo Client instance
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          products: {
            keyArgs: ['tenantId', 'search', 'categoryId', 'brandId'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          categories: {
            keyArgs: ['tenantId', 'search'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          brands: {
            keyArgs: ['tenantId', 'search'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          locations: {
            keyArgs: ['tenantId', 'search'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          inventory: {
            keyArgs: ['tenantId', 'locationId', 'productId'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          transactions: {
            keyArgs: ['tenantId', 'type', 'locationId'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          tenants: {
            keyArgs: ['filter', 'sort'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          users: {
            keyArgs: ['tenantId', 'filter', 'sort'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          auditLogs: {
            keyArgs: ['tenantId', 'filter', 'sort'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: import.meta.env.VITE_APP_ENV === 'development',
});

// Types for GraphQL operations
export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
  extensions?: Record<string, any>;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
  loading: boolean;
  networkStatus: number;
}

// Utility functions
export const clearCache = () => {
  apolloClient.clearStore();
};

export const refetchQueries = (queryNames: string[]) => {
  apolloClient.refetchQueries({
    include: queryNames,
  });
};

export default apolloClient;
