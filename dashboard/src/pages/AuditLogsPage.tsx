import { FileText, Filter, Search, Download, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const mockAuditLogs = [
  {
    id: '1',
    timestamp: '2025-05-28T14:30:25Z',
    action: 'User Login',
    resource: 'Authentication',
    user: 'john.smith@acme.com',
    tenant: 'Acme Corporation',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'success',
    details: 'Successful login via web interface',
  },
  {
    id: '2',
    timestamp: '2025-05-28T14:25:12Z',
    action: 'Inventory Updated',
    resource: 'Product',
    user: 'sarah.j@techstart.com',
    tenant: 'TechStart Inc',
    ipAddress: '10.0.1.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'success',
    details: 'Updated stock quantity for SKU-12345',
  },
  {
    id: '3',
    timestamp: '2025-05-28T14:20:45Z',
    action: 'Failed Login Attempt',
    resource: 'Authentication',
    user: 'unknown@example.com',
    tenant: 'N/A',
    ipAddress: '203.0.113.42',
    userAgent: 'curl/7.68.0',
    status: 'failed',
    details: 'Invalid credentials provided',
  },
  {
    id: '4',
    timestamp: '2025-05-28T14:15:33Z',
    action: 'User Created',
    resource: 'User',
    user: 'admin@ventory.com',
    tenant: 'Global Retail',
    ipAddress: '172.16.0.10',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    status: 'success',
    details: 'Created new user account for emily.davis@global.com',
  },
  {
    id: '5',
    timestamp: '2025-05-28T14:10:18Z',
    action: 'Permission Changed',
    resource: 'User',
    user: 'admin@ventory.com',
    tenant: 'Acme Corporation',
    ipAddress: '172.16.0.10',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    status: 'success',
    details: 'Updated permissions for user john.smith@acme.com',
  },
  {
    id: '6',
    timestamp: '2025-05-28T14:05:27Z',
    action: 'Report Generated',
    resource: 'Report',
    user: 'manager@techstart.com',
    tenant: 'TechStart Inc',
    ipAddress: '10.0.1.75',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'success',
    details: 'Generated inventory summary report',
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return <Badge variant="success">Success</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'warning':
      return <Badge variant="warning">Warning</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getActionColor = (action: string) => {
  if (action.includes('Login') || action.includes('Authentication'))
    return 'text-blue-600';
  if (action.includes('Created') || action.includes('Added'))
    return 'text-green-600';
  if (action.includes('Updated') || action.includes('Changed'))
    return 'text-yellow-600';
  if (action.includes('Deleted') || action.includes('Failed'))
    return 'text-red-600';
  return 'text-gray-600';
};

export function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Monitor all system activities and security events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter audit logs by time, user, action, or tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Input placeholder="All actions" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Input placeholder="All users" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tenant</label>
              <Input placeholder="All tenants" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Showing the latest audit log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAuditLogs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                      {getStatusBadge(log.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">User:</span>
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {log.user}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Tenant:</span>
                          <span>{log.tenant}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            Resource:
                          </span>
                          <span>{log.resource}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">IP:</span>
                          <span className="font-mono text-xs">
                            {log.ipAddress}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            Details:
                          </span>
                          <span className="text-xs">{log.details}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.2%</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">23</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
