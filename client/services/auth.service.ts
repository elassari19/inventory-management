import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  user: any | null;
  currentTenant: any | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    companyName: string
  ) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  currentTenant: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      await SecureStore.setItemAsync('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      set({
        token: data.token,
        user: data.user,
        currentTenant: data.currentTenant,
      });
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await AsyncStorage.removeItem('user');
      set({ token: null, user: null, currentTenant: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  switchTenant: async (tenantId: string) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch('http://localhost:3001/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tenantId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      await SecureStore.setItemAsync('token', data.token);
      set({ token: data.token, currentTenant: data.currentTenant });
    } catch (error) {
      throw error;
    }
  },

  register: async (email: string, password: string, companyName: string) => {
    try {
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, companyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      await SecureStore.setItemAsync('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      set({
        token: data.token,
        user: data.user,
        currentTenant: data.currentTenant,
      });
    } catch (error) {
      throw error;
    }
  },
}));
