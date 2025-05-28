import { Settings, Database, Shield, Bell, Globe, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

const systemSettings = [
  {
    category: 'System',
    icon: Settings,
    settings: [
      { name: 'System Name', value: 'Ventory Admin Dashboard', type: 'text' },
      { name: 'Maintenance Mode', value: 'Disabled', type: 'toggle' },
      { name: 'Auto Backup', value: 'Enabled', type: 'toggle' },
      { name: 'Session Timeout', value: '8 hours', type: 'select' },
    ],
  },
  {
    category: 'Database',
    icon: Database,
    settings: [
      { name: 'Connection Pool Size', value: '50', type: 'number' },
      { name: 'Query Timeout', value: '30s', type: 'text' },
      { name: 'Backup Frequency', value: 'Daily', type: 'select' },
      { name: 'Retention Period', value: '90 days', type: 'select' },
    ],
  },
  {
    category: 'Security',
    icon: Shield,
    settings: [
      { name: 'Two-Factor Authentication', value: 'Required', type: 'toggle' },
      { name: 'Password Policy', value: 'Strong', type: 'select' },
      { name: 'Login Attempts', value: '5', type: 'number' },
      { name: 'Session Security', value: 'High', type: 'select' },
    ],
  },
  {
    category: 'Notifications',
    icon: Bell,
    settings: [
      { name: 'Email Notifications', value: 'Enabled', type: 'toggle' },
      { name: 'SMS Alerts', value: 'Enabled', type: 'toggle' },
      { name: 'Webhook Notifications', value: 'Disabled', type: 'toggle' },
      { name: 'Alert Frequency', value: 'Immediate', type: 'select' },
    ],
  },
];

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <Button>Save Changes</Button>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            System Status
          </CardTitle>
          <CardDescription>
            Current system health and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <Badge variant="success" className="mb-2">
                Operational
              </Badge>
              <p className="text-sm font-medium">API Services</p>
            </div>
            <div className="text-center">
              <Badge variant="success" className="mb-2">
                Healthy
              </Badge>
              <p className="text-sm font-medium">Database</p>
            </div>
            <div className="text-center">
              <Badge variant="warning" className="mb-2">
                Degraded
              </Badge>
              <p className="text-sm font-medium">Storage</p>
            </div>
            <div className="text-center">
              <Badge variant="success" className="mb-2">
                Active
              </Badge>
              <p className="text-sm font-medium">Monitoring</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Categories */}
      <div className="grid gap-6">
        {systemSettings.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {category.category} Settings
                </CardTitle>
                <CardDescription>
                  Configure {category.category.toLowerCase()} related settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.settings.map((setting) => (
                    <div
                      key={setting.name}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{setting.name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {setting.type === 'toggle' ? (
                          <Badge
                            variant={
                              setting.value === 'Enabled'
                                ? 'success'
                                : 'secondary'
                            }
                          >
                            {setting.value}
                          </Badge>
                        ) : setting.type === 'text' ||
                          setting.type === 'number' ? (
                          <Input
                            defaultValue={setting.value}
                            className="w-32 h-8 text-sm"
                            type={setting.type === 'number' ? 'number' : 'text'}
                          />
                        ) : (
                          <Badge variant="outline">{setting.value}</Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            Configure SMTP settings for system notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">SMTP Server</label>
              <Input defaultValue="smtp.ventory.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Port</label>
              <Input defaultValue="587" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input defaultValue="noreply@ventory.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">From Address</label>
              <Input defaultValue="Ventory System <noreply@ventory.com>" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline">Test Connection</Button>
            <Button>Save Configuration</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
