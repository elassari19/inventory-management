import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

// Types for our sync service
export interface SyncOperation {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  error?: string;
}

export interface SyncQueueState {
  operations: SyncOperation[];
  isSyncing: boolean;
  lastSyncTime: number | null;
  isOnline: boolean;

  // Methods
  addOperation: (
    operation: Omit<SyncOperation, 'id' | 'timestamp' | 'synced' | 'retryCount'>
  ) => Promise<void>;
  syncNow: () => Promise<boolean>;
  clearSyncQueue: () => Promise<void>;
  loadQueue: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  getUnsynced: () => SyncOperation[];
  getOperationsByEntity: (entity: string) => SyncOperation[];
}

const SYNC_QUEUE_STORAGE_KEY = 'ventory_sync_queue';
const API_ENDPOINT = process.env.API_URL || 'http://localhost:3001/api';

// Create the Zustand store for sync operations
export const useSyncQueue = create<SyncQueueState>((set, get) => ({
  operations: [],
  isSyncing: false,
  lastSyncTime: null,
  isOnline: true,

  // Add a new operation to the sync queue
  addOperation: async (operation) => {
    const newOperation: SyncOperation = {
      id: uuidv4(),
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
      ...operation,
    };

    set((state) => ({
      operations: [...state.operations, newOperation],
    }));

    // Save to storage
    await AsyncStorage.setItem(
      SYNC_QUEUE_STORAGE_KEY,
      JSON.stringify(get().operations)
    );

    // If we're online, try to sync immediately
    if (get().isOnline && !get().isSyncing) {
      get().syncNow();
    }
  },

  // Attempt to sync all pending operations
  syncNow: async () => {
    const state = get();
    if (state.isSyncing || !state.isOnline) {
      return false;
    }

    const unsynced = state.operations.filter((op) => !op.synced);
    if (unsynced.length === 0) {
      return true;
    }

    set({ isSyncing: true });

    try {
      // Get auth token
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Try to sync each operation in order
      const results = await Promise.all(
        unsynced.map(async (operation) => {
          try {
            let endpoint = `${API_ENDPOINT}/${operation.entity}`;
            let method = 'POST';

            // Determine HTTP method based on operation type
            switch (operation.operation) {
              case 'CREATE':
                method = 'POST';
                break;
              case 'UPDATE':
                method = 'PUT';
                endpoint = `${endpoint}/${operation.data.id}`;
                break;
              case 'DELETE':
                method = 'DELETE';
                endpoint = `${endpoint}/${operation.data.id}`;
                break;
            }

            // Make the API request
            const response = await fetch(endpoint, {
              method,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body:
                method !== 'DELETE'
                  ? JSON.stringify(operation.data)
                  : undefined,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Sync failed');
            }

            return {
              ...operation,
              synced: true,
              error: undefined,
            };
          } catch (error: any) {
            // If the operation fails, increment retry count and save error
            return {
              ...operation,
              retryCount: operation.retryCount + 1,
              error: error.message,
            };
          }
        })
      );

      // Update operations with sync results
      set((state) => ({
        operations: state.operations.map(
          (op) => results.find((r) => r.id === op.id) || op
        ),
        lastSyncTime: Date.now(),
      }));

      // Save updated queue to storage
      await AsyncStorage.setItem(
        SYNC_QUEUE_STORAGE_KEY,
        JSON.stringify(get().operations)
      );

      // Clean up synced operations that are older than 24 hours
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const cleanedOperations = get().operations.filter(
        (op) => !op.synced || op.timestamp > oneDayAgo
      );

      if (cleanedOperations.length !== get().operations.length) {
        set({ operations: cleanedOperations });
        await AsyncStorage.setItem(
          SYNC_QUEUE_STORAGE_KEY,
          JSON.stringify(cleanedOperations)
        );
      }

      return unsynced.every(
        (op) => results.find((r) => r.id === op.id)?.synced
      );
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    } finally {
      set({ isSyncing: false });
    }
  },

  // Clear the sync queue
  clearSyncQueue: async () => {
    set({ operations: [] });
    await AsyncStorage.removeItem(SYNC_QUEUE_STORAGE_KEY);
  },

  // Load the sync queue from storage
  loadQueue: async () => {
    try {
      const storedQueue = await AsyncStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
      if (storedQueue) {
        set({ operations: JSON.parse(storedQueue) });
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  },

  // Update online status
  setOnlineStatus: (isOnline) => {
    set({ isOnline });

    // If we just came back online, try to sync
    if (isOnline && !get().isSyncing) {
      get().syncNow();
    }
  },

  // Get all unsynced operations
  getUnsynced: () => {
    return get().operations.filter((op) => !op.synced);
  },

  // Get operations for a specific entity
  getOperationsByEntity: (entity) => {
    return get().operations.filter((op) => op.entity === entity);
  },
}));

// Network connectivity monitoring
export const initNetworkMonitoring = () => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    useSyncQueue
      .getState()
      .setOnlineStatus(
        state.isConnected === true && state.isInternetReachable !== false
      );
  });

  return unsubscribe;
};

// Initialize sync service
export const initSyncService = async () => {
  // Load existing queue from storage
  await useSyncQueue.getState().loadQueue();

  // Setup network monitoring
  initNetworkMonitoring();

  // Set up periodic sync attempts
  setInterval(() => {
    if (
      useSyncQueue.getState().isOnline &&
      !useSyncQueue.getState().isSyncing
    ) {
      useSyncQueue.getState().syncNow();
    }
  }, 5 * 60 * 1000); // Try to sync every 5 minutes
};
