import React, { useState } from 'react';
import { useAppDispatch } from '../hooks/redux';
import { loginSuccess, loginFailure } from '../store/slices/authSlice';
import { setCurrentTenant } from '../store/slices/tenantSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '../services/graphql/queries';
import { useToast } from '../components/ui/ToastProvider';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [email, setEmail] = useState('admin@ventory.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);

  const [loginMutation] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      if (data.login) {
        // Store authentication data
        localStorage.setItem('token', data.login.token);
        localStorage.setItem('refreshToken', data.login.refreshToken);

        // Update Redux store
        dispatch(
          loginSuccess({
            user: {
              id: data.login.user.id,
              email: data.login.user.email,
              firstName: data.login.user.firstName,
              lastName: data.login.user.lastName,
            },
            token: data.login.token,
            refreshToken: data.login.refreshToken,
            tenants: data.login.tenants || [],
            currentTenant: data.login.currentTenant || data.login.tenants?.[0],
          })
        );

        // Set current tenant if available
        const currentTenant =
          data.login.currentTenant || data.login.tenants?.[0];
        if (currentTenant) {
          dispatch(setCurrentTenant(currentTenant));
        }

        toast({
          title: 'Login Successful',
          description: 'Welcome to Ventory Dashboard',
          type: 'success',
        });
      }
    },
    onError: (error) => {
      console.error('Login error:', error);
      dispatch(loginFailure(error.message));
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password',
        type: 'error',
      });
      setIsLoading(false);
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await loginMutation({
        variables: {
          email,
          password,
        },
      });
    } catch (error) {
      // Error handling is done in onError callback
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">
                V
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            Welcome to Ventory
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ventory.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
