import { useState, useMemo } from 'react';
import { Plus, Search, Filter, MoreHorizontal, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Drawer, DrawerContent, DrawerFooter } from '../components/ui/Drawer';

const mockTenants = [
  {
    id: '1',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    status: 'active' as const,
    plan: 'enterprise' as const,
    users: 45,
    createdAt: '2024-01-15',
    lastActivity: '2 hours ago',
  },
  {
    id: '2',
    name: 'TechStart Inc',
    slug: 'techstart',
    status: 'active' as const,
    plan: 'pro' as const,
    users: 12,
    createdAt: '2024-02-20',
    lastActivity: '30 minutes ago',
  },
  {
    id: '3',
    name: 'Global Retail',
    slug: 'global-retail',
    status: 'suspended' as const,
    plan: 'pro' as const,
    users: 8,
    createdAt: '2024-03-10',
    lastActivity: '3 days ago',
  },
  {
    id: '4',
    name: 'StartupCorp',
    slug: 'startup-corp',
    status: 'active' as const,
    plan: 'free' as const,
    users: 3,
    createdAt: '2024-04-05',
    lastActivity: '1 hour ago',
  },
  {
    id: '5',
    name: 'Mega Enterprise',
    slug: 'mega-enterprise',
    status: 'inactive' as const,
    plan: 'enterprise' as const,
    users: 150,
    createdAt: '2024-01-01',
    lastActivity: '1 week ago',
  },
];

interface FilterState {
  search: string;
  status: string;
  plan: string;
}

interface NewTenantForm {
  name: string;
  slug: string;
  plan: string;
  description: string;
}

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const planOptions = [
  { value: 'all', label: 'All Plans' },
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

const newTenantPlanOptions = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

export function TenantsPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    plan: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState<NewTenantForm>({
    name: '',
    slug: '',
    plan: 'free',
    description: '',
  });

  // Filter tenants based on current filters
  const filteredTenants = useMemo(() => {
    return mockTenants.filter((tenant) => {
      const matchesSearch =
        tenant.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === 'all' || tenant.status === filters.status;

      const matchesPlan =
        filters.plan === 'all' || tenant.plan === filters.plan;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [filters]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      search: event.target.value,
    }));
  };

  const handleStatusChange = (value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      status: value as string,
    }));
  };

  const handlePlanChange = (value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      plan: value as string,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      plan: 'all',
    });
    setShowFilters(false);
  };

  const hasActiveFilters =
    filters.search || filters.status !== 'all' || filters.plan !== 'all';

  const handleAddTenant = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Reset form when closing
    setNewTenantForm({
      name: '',
      slug: '',
      plan: 'free',
      description: '',
    });
  };

  const handleFormChange = (field: keyof NewTenantForm, value: string) => {
    setNewTenantForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setNewTenantForm((prev) => ({
        ...prev,
        slug,
      }));
    }
  };

  const handleCreateTenant = () => {
    // Validate form
    if (!newTenantForm.name.trim()) {
      return;
    }

    // Here you would typically make an API call to create the tenant
    console.log('Creating tenant:', newTenantForm);

    // Close drawer and reset form
    handleCloseDrawer();
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage and monitor all tenant organizations
          </p>
        </div>
        <Button onClick={handleAddTenant}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              className="pl-10"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Status:</span>
              <Select
                value={filters.status}
                options={statusOptions}
                onChange={handleStatusChange}
                className="w-32"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Plan:</span>
              <Select
                value={filters.plan}
                options={planOptions}
                onChange={handlePlanChange}
                className="w-32"
              />
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredTenants.length} of {mockTenants.length} tenants
          </p>
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                Active filters:
              </span>
              {filters.search && (
                <Badge variant="secondary">Search: {filters.search}</Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary">Status: {filters.status}</Badge>
              )}
              {filters.plan !== 'all' && (
                <Badge variant="secondary">Plan: {filters.plan}</Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">{tenant.name}</CardTitle>
                <CardDescription>{tenant.slug}</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      tenant.status === 'active'
                        ? 'success'
                        : tenant.status === 'suspended'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {tenant.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <Badge variant="outline">{tenant.plan}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Users</span>
                  <span className="text-sm font-medium">{tenant.users}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Activity
                  </span>
                  <span className="text-sm">{tenant.lastActivity}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Tenant Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title="Add New Tenant"
        description="Create a new tenant organization"
        size="md"
      >
        <DrawerContent>
          <div className="space-y-6">
            {/* Tenant Name */}
            <div className="space-y-2">
              <label
                htmlFor="tenant-name"
                className="text-sm font-medium text-foreground"
              >
                Tenant Name *
              </label>
              <Input
                id="tenant-name"
                placeholder="Enter tenant name"
                value={newTenantForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>

            {/* Tenant Slug */}
            <div className="space-y-2">
              <label
                htmlFor="tenant-slug"
                className="text-sm font-medium text-foreground"
              >
                Tenant Slug *
              </label>
              <Input
                id="tenant-slug"
                placeholder="tenant-slug"
                value={newTenantForm.slug}
                onChange={(e) => handleFormChange('slug', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This will be used in URLs and must be unique
              </p>
            </div>

            {/* Plan Selection */}
            <div className="space-y-2">
              <label
                htmlFor="tenant-plan"
                className="text-sm font-medium text-foreground"
              >
                Plan *
              </label>
              <Select
                value={newTenantForm.plan}
                options={newTenantPlanOptions}
                onChange={(value) => handleFormChange('plan', value as string)}
                placeholder="Select a plan"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="tenant-description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="tenant-description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter tenant description (optional)"
                value={newTenantForm.description}
                onChange={(e) =>
                  handleFormChange('description', e.target.value)
                }
                rows={3}
              />
            </div>
          </div>
        </DrawerContent>

        <DrawerFooter>
          <Button variant="outline" onClick={handleCloseDrawer}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTenant}
            disabled={!newTenantForm.name.trim()}
          >
            Create Tenant
          </Button>
        </DrawerFooter>
      </Drawer>
    </div>
  );
}
