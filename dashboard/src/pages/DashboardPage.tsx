import { Users, Building2, Package, Activity, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const metrics = [
  {
    title: 'Total Tenants',
    value: '2,847',
    change: '+12%',
    icon: Building2,
    trend: 'up',
  },
  {
    title: 'Active Users',
    value: '18,392',
    change: '+8%',
    icon: Users,
    trend: 'up',
  },
  {
    title: 'Total Products',
    value: '1.2M',
    change: '+15%',
    icon: Package,
    trend: 'up',
  },
  {
    title: 'System Uptime',
    value: '99.9%',
    change: '24h',
    icon: Activity,
    trend: 'stable',
  },
];

const recentActivity = [
  {
    id: 1,
    action: 'New tenant created',
    tenant: 'Acme Corp',
    time: '2 minutes ago',
    status: 'success',
  },
  {
    id: 2,
    action: 'Inventory sync completed',
    tenant: 'TechStart Inc',
    time: '5 minutes ago',
    status: 'success',
  },
  {
    id: 3,
    action: 'User permission updated',
    tenant: 'Global Retail',
    time: '10 minutes ago',
    status: 'info',
  },
  {
    id: 4,
    action: 'System maintenance scheduled',
    tenant: 'System',
    time: '15 minutes ago',
    status: 'warning',
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and key metrics for the Ventory platform
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      metric.trend === 'up'
                        ? 'text-green-600'
                        : metric.trend === 'down'
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                    }
                  >
                    {metric.change}
                  </span>
                  {metric.trend !== 'stable' && ' from last month'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Current status of system components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Services</span>
              <Badge variant="success">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge variant="success">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Authentication</span>
              <Badge variant="success">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage</span>
              <Badge variant="warning">Degraded</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.tenant}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        activity.status === 'success'
                          ? 'success'
                          : activity.status === 'warning'
                          ? 'warning'
                          : activity.status === 'info'
                          ? 'info'
                          : 'default'
                      }
                      className="mb-1"
                    >
                      {activity.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
