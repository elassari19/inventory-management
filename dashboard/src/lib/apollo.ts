import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
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
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
  })
);

// Auth Link
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from Redux store
  const token = store.getState().auth.token;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-tenant-id': localStorage.getItem('tenantId') || '',
    },
  };
});

// Error Link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // Handle authentication errors
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // Dispatch logout action
      store.dispatch({ type: 'auth/logout' });
    }
  }
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
  from([errorLink, authLink, httpLink])
);

// Create the Apollo Client instance
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          tenants: {
            keyArgs: ['filter', 'sort'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          users: {
            keyArgs: ['filter', 'sort'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          inventory: {
            keyArgs: ['filter', 'sort'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          auditLogs: {
            keyArgs: ['filter', 'sort'],
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
