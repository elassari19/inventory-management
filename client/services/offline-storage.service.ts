import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline storage utility for managing local data persistence
 * This service provides a simple key-value store interface with JSON serialization
 */
class OfflineStorageService {
  /**
   * Store data in local storage
   * @param key Storage key
   * @param data Data to store (will be JSON serialized)
   */
  async setItem<T>(key: string, data: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from local storage
   * @param key Storage key
   * @returns Parsed data or null if not found
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove item from local storage
   * @param key Storage key
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if an item exists in storage
   * @param key Storage key
   * @returns True if item exists
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value != null;
    } catch (error) {
      console.error(`Error checking for key ${key}:`, error);
      return false;
    }
  }

  /**
   * List all keys with a specific prefix
   * @param prefix Key prefix to match
   * @returns Array of matching keys
   */
  async getKeys(prefix: string): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys.filter((key) => key.startsWith(prefix));
    } catch (error) {
      console.error(`Error listing keys with prefix ${prefix}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple items by prefix as a map
   * @param prefix Key prefix to match
   * @returns Map of key-value pairs
   */
  async getAllWithPrefix<T>(prefix: string): Promise<Record<string, T>> {
    try {
      const keys = await this.getKeys(prefix);
      const keyValuePairs = await AsyncStorage.multiGet(keys);

      const result: Record<string, T> = {};
      for (const [key, value] of keyValuePairs) {
        if (value) {
          result[key] = JSON.parse(value);
        }
      }

      return result;
    } catch (error) {
      console.error(`Error getting items with prefix ${prefix}:`, error);
      throw error;
    }
  }

  /**
   * Store multiple items at once (transaction)
   * @param items Array of key-value pairs to store
   */
  async multiSet(items: Array<[string, any]>): Promise<void> {
    try {
      const jsonItems = items.map(
        ([key, value]) => [key, JSON.stringify(value)] as [string, string]
      );
      await AsyncStorage.multiSet(jsonItems);
    } catch (error) {
      console.error('Error storing multiple items:', error);
      throw error;
    }
  }

  /**
   * Clear all application storage (use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Clear all items with a specific prefix
   * @param prefix Key prefix to match
   */
  async clearWithPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.getKeys(prefix);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error(`Error clearing items with prefix ${prefix}:`, error);
      throw error;
    }
  }
}

export const offlineStorage = new OfflineStorageService();
