import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  ApolloLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

// HTTP Link
const httpLink = createHttpLink({
  uri: __DEV__
    ? 'http://localhost:3001/graphql'
    : 'https://api.ventory.app/graphql',
});

// Auth Link - adds authentication headers
const authLink = setContext(async (_, { headers }) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    const tenantId = await AsyncStorage.getItem('currentTenantId');

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
        'x-tenant-id': tenantId || '',
      },
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return { headers };
  }
});

// Error Link - handles GraphQL and network errors
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
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
        // Clear stored credentials and redirect to login
        SecureStore.deleteItemAsync('token');
        AsyncStorage.removeItem('user');
        // You can add navigation logic here to redirect to login
      }
    }
  }
);

// Retry Link - retries failed requests
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      // Retry on network errors but not on GraphQL errors
      return !!error && !error.result;
    },
  },
});

// Offline Link - queues mutations when offline
class OfflineLink extends ApolloLink {
  private offlineQueue: Array<any> = [];
  private isOnline: boolean = true;

  constructor() {
    super();
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline =
        state.isConnected === true && state.isInternetReachable !== false;

      // If we just came back online, process the queue
      if (wasOffline && this.isOnline) {
        this.processOfflineQueue();
      }
    });
  }

  private processOfflineQueue() {
    while (this.offlineQueue.length > 0) {
      const { operation, forward, observer } = this.offlineQueue.shift();
      forward(operation).subscribe(observer);
    }
  }

  request(operation: any, forward: any) {
    // If online, proceed normally
    if (this.isOnline) {
      return forward(operation);
    }

    // If offline and it's a query, return cached data or error
    if (operation.query.definitions[0].operation === 'query') {
      // Let Apollo handle cached queries
      return forward(operation);
    }

    // If offline and it's a mutation, queue it
    return new Promise((resolve, reject) => {
      this.offlineQueue.push({
        operation,
        forward,
        observer: {
          next: resolve,
          error: reject,
          complete: () => {},
        },
      });

      // Return a temporary response for optimistic updates
      resolve({
        data: null,
        loading: false,
        networkStatus: 7,
      });
    });
  }
}

const offlineLink = new OfflineLink();

// Combine all links
const link = from([errorLink, retryLink, offlineLink, authLink, httpLink]);

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          products: {
            keyArgs: ['tenantId', 'search', 'categoryId'],
            merge(existing = [], incoming = []) {
              return [...existing, ...incoming];
            },
          },
          inventoryTransactions: {
            keyArgs: ['tenantId', 'productId'],
            merge(existing = [], incoming = []) {
              return [...existing, ...incoming];
            },
          },
        },
      },
      Product: {
        keyFields: ['id'],
      },
      InventoryTransaction: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'cache-first',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// Utility functions
export const clearCache = () => {
  apolloClient.clearStore();
};

export const resetStore = () => {
  apolloClient.resetStore();
};

export default apolloClient;
