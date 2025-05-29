import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/redux';
import { ToastProvider } from './components/ui/ToastProvider';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TenantsPage } from './pages/TenantsPage';
import { UsersPage } from './pages/UsersPage';
import { InventoryPage } from './pages/InventoryPage';
import { BillingPage } from './pages/BillingPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

function App() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <ErrorBoundary>
      <ToastProvider>
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tenants" element={<TenantsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route
                path="/login"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        )}
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
