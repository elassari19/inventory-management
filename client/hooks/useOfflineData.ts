import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncQueue } from '@/services/sync.service';

type DataStatus = 'idle' | 'loading' | 'error' | 'success' | 'offline';

interface UseOfflineDataOptions<T> {
  key: string;
  fetchFn: () => Promise<T[]>;
  idField?: keyof T & string;
  autoSync?: boolean;
}

export function useOfflineData<T extends Record<string, any>>({
  key,
  fetchFn,
  idField = 'id' as keyof T & string,
  autoSync = true,
}: UseOfflineDataOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<DataStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { isOnline, addOperation, getOperationsByEntity } = useSyncQueue();

  const storageKey = `ventory_offline_data_${key}`;

  // Load data from API or fallback to local storage
  const fetchData = useCallback(async () => {
    setStatus('loading');

    try {
      // Try to get data from API if online
      if (isOnline) {
        const apiData = await fetchFn();
        setData(apiData);

        // Cache the data locally
        await AsyncStorage.setItem(storageKey, JSON.stringify(apiData));

        setStatus('success');
        return;
      }

      // If offline, load from local storage
      const storedData = await AsyncStorage.getItem(storageKey);
      if (storedData) {
        setData(JSON.parse(storedData));
        setStatus('offline');
      } else {
        setStatus('error');
        setError('No offline data available');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');

      // Try to load from cache as fallback even when online
      try {
        const storedData = await AsyncStorage.getItem(storageKey);
        if (storedData) {
          setData(JSON.parse(storedData));
          setStatus('offline');
          setError(null);
        }
      } catch (cacheErr) {
        console.error('Error loading from cache:', cacheErr);
      }
    }
  }, [fetchFn, isOnline, storageKey]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply pending sync operations to local data
  useEffect(() => {
    const pendingOps = getOperationsByEntity(key);
    if (pendingOps.length === 0) return;

    // Apply pending changes to local data
    const updatedData = [...data];

    pendingOps.forEach((op) => {
      const index = updatedData.findIndex(
        (item) => item[idField] === op.data[idField]
      );

      switch (op.operation) {
        case 'CREATE':
          if (!op.synced && index === -1) {
            updatedData.push(op.data);
          }
          break;
        case 'UPDATE':
          if (index !== -1) {
            updatedData[index] = { ...updatedData[index], ...op.data };
          }
          break;
        case 'DELETE':
          if (index !== -1) {
            updatedData.splice(index, 1);
          }
          break;
      }
    });

    setData(updatedData);
  }, [data, getOperationsByEntity, key, idField]);

  // Add a new item locally and queue for sync
  const addItem = async (
    item: Omit<T, typeof idField> & Partial<Record<typeof idField, string>>
  ) => {
    // Generate a temporary local ID if none provided
    const newItem = {
      ...item,
      [idField]:
        item[idField] ||
        `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      _locallyCreated: true,
    } as unknown as T;

    // Update local state
    setData((prevData) => [...prevData, newItem]);

    // Update local storage
    const updatedData = [...data, newItem];
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedData));

    // Queue for sync
    await addOperation({
      operation: 'CREATE',
      entity: key,
      data: newItem,
    });

    return newItem;
  };

  // Update an item locally and queue for sync
  const updateItem = async (id: string, updates: Partial<T>) => {
    const index = data.findIndex((item) => item[idField] === id);
    if (index === -1) {
      throw new Error(`Item with ID ${id} not found`);
    }

    // Create updated item
    const updatedItem = { ...data[index], ...updates };

    // Update local state
    const updatedData = [...data];
    updatedData[index] = updatedItem;
    setData(updatedData);

    // Update local storage
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedData));

    // Queue for sync
    await addOperation({
      operation: 'UPDATE',
      entity: key,
      data: updatedItem,
    });

    return updatedItem;
  };

  // Remove an item locally and queue for sync
  const removeItem = async (id: string) => {
    const index = data.findIndex((item) => item[idField] === id);
    if (index === -1) {
      throw new Error(`Item with ID ${id} not found`);
    }

    // Get the item to be deleted for sync
    const itemToDelete = data[index];

    // Update local state
    const updatedData = [...data];
    updatedData.splice(index, 1);
    setData(updatedData);

    // Update local storage
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedData));

    // Queue for sync
    await addOperation({
      operation: 'DELETE',
      entity: key,
      data: { [idField]: id },
    });

    return itemToDelete;
  };

  // Manually refresh data from the server
  const refresh = async () => {
    return fetchData();
  };

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isOffline: status === 'offline',
    addItem,
    updateItem,
    removeItem,
    refresh,
  };
}
