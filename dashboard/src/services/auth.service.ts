import { useMutation } from '@apollo/client';
import { useAppDispatch } from '../hooks/redux';
import { loginSuccess, loginFailure, logout } from '../store/slices/authSlice';
import { setCurrentTenant } from '../store/slices/tenantSlice';
import { LOGIN_MUTATION, REGISTER_MUTATION, SELECT_TENANT_MUTATION, LOGOUT_MUTATION } from './graphql/queries';
import { apolloClient } from '../lib/apollo';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export function useAuth() {
  const dispatch = useAppDispatch();

  const [loginMutation] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      if (data.login) {
        // Store authentication data
        localStorage.setItem('token', data.login.token);
        localStorage.setItem('refreshToken', data.login.refreshToken);
        
        // Update Redux store
        dispatch(loginSuccess({
          user: data.login.user,
          token: data.login.token,
          refreshToken: data.login.refreshToken,
          tenants: data.login.tenants || [],
          currentTenant: data.login.currentTenant || data.login.tenants?.[0],
        }));

        // Set current tenant if available
        const currentTenant = data.login.currentTenant || data.login.tenants?.[0];
        if (currentTenant) {
          dispatch(setCurrentTenant(currentTenant));
        }
      }
    },
    onError: (error) => {
      dispatch(loginFailure(error.message));
      throw error;
    },
  });

  const [registerMutation] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      if (data.register) {
        // Store authentication data
        localStorage.setItem('token', data.register.token);
        localStorage.setItem('refreshToken', data.register.refreshToken);
        
        // Update Redux store
        dispatch(loginSuccess({
          user: data.register.user,
          token: data.register.token,
          refreshToken: data.register.refreshToken,
          tenants: data.register.tenants || [],
          currentTenant: data.register.currentTenant || data.register.tenants?.[0],
        }));

        // Set current tenant if available
        const currentTenant = data.register.currentTenant || data.register.tenants?.[0];
        if (currentTenant) {
          dispatch(setCurrentTenant(currentTenant));
        }
      }
    },
    onError: (error) => {
      throw error;
    },
  });

  const [selectTenantMutation] = useMutation(SELECT_TENANT_MUTATION, {
    onCompleted: (data) => {
      if (data.selectTenant) {
        // Update token with tenant context
        localStorage.setItem('token', data.selectTenant.token);
        localStorage.setItem('refreshToken', data.selectTenant.refreshToken);
        
        // Update current tenant
        if (data.selectTenant.currentTenant) {
          dispatch(setCurrentTenant(data.selectTenant.currentTenant));
        }
      }
    },
    onError: (error) => {
      throw error;
    },
  });

  const [logoutMutation] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentTenantId');
      
      // Clear Apollo cache
      apolloClient.clearStore();
      
      // Update Redux store
      dispatch(logout());
    },
    onError: (error) => {
      // Even if logout fails on server, clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentTenantId');
      apolloClient.clearStore();
      dispatch(logout());
    },
  });

  const login = async (credentials: LoginCredentials) => {
    const result = await loginMutation({
      variables: credentials,
    });
    return result.data?.login;
  };

  const register = async (data: RegisterData) => {
    const result = await registerMutation({
      variables: data,
    });
    return result.data?.register;
  };

  const selectTenant = async (tenantId: string) => {
    const result = await selectTenantMutation({
      variables: { tenantId },
    });
    return result.data?.selectTenant;
  };

  const logoutUser = async () => {
    await logoutMutation();
  };

  return {
    login,
    register,
    selectTenant,
    logout: logoutUser,
  };
}
