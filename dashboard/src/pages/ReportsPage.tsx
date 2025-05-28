import { BarChart3, Download, Calendar, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const reportTemplates = [
  {
    id: '1',
    name: 'Inventory Summary',
    description: 'Complete overview of inventory levels across all locations',
    type: 'inventory_summary',
    lastGenerated: '2 hours ago',
    frequency: 'Daily',
  },
  {
    id: '2',
    name: 'Stock Movement Report',
    description: 'Detailed log of all inventory movements and transactions',
    type: 'stock_movement',
    lastGenerated: '1 day ago',
    frequency: 'Weekly',
  },
  {
    id: '3',
    name: 'Low Stock Alert',
    description: 'Items below minimum threshold requiring reorder',
    type: 'low_stock',
    lastGenerated: '6 hours ago',
    frequency: 'Daily',
  },
  {
    id: '4',
    name: 'Inventory Valuation',
    description: 'Financial value of current inventory holdings',
    type: 'valuation',
    lastGenerated: '3 days ago',
    frequency: 'Monthly',
  },
];

const recentReports = [
  {
    id: '1',
    name: 'Daily Inventory Summary - May 28, 2025',
    generatedAt: '2025-05-28 08:00:00',
    size: '2.4 MB',
    format: 'PDF',
  },
  {
    id: '2',
    name: 'Weekly Stock Movement - Week 21',
    generatedAt: '2025-05-27 18:30:00',
    size: '5.8 MB',
    format: 'Excel',
  },
  {
    id: '3',
    name: 'Low Stock Alert - May 28, 2025',
    generatedAt: '2025-05-28 06:00:00',
    size: '890 KB',
    format: 'PDF',
  },
];

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Generate and manage reports across all tenant data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Report
          </Button>
          <Button>
            <BarChart3 className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Report Templates</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {reportTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="outline">{template.frequency}</Badge>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Last generated: {template.lastGenerated}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-3 w-3" />
                      Configure
                    </Button>
                    <Button size="sm">Generate</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Recently generated reports available for download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">{report.name}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>
                      Generated: {new Date(report.generatedAt).toLocaleString()}
                    </span>
                    <span>Size: {report.size}</span>
                    <Badge variant="secondary" className="text-xs">
                      {report.format}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-3 w-3" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Report Generation</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+23%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>Active schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">3</span> running today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Coverage</CardTitle>
            <CardDescription>Tenants with reporting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+1.2%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
