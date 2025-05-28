import { useState } from 'react';
import { Package, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
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

const inventoryMetrics = [
  {
    title: 'Total Products',
    value: '1,234,567',
    change: '+2.5%',
    icon: Package,
  },
  {
    title: 'Low Stock Items',
    value: '89',
    change: '+12',
    icon: AlertTriangle,
    variant: 'warning' as const,
  },
  {
    title: 'Total Value',
    value: '$2.4M',
    change: '+8.2%',
    icon: TrendingUp,
  },
  {
    title: 'Active Locations',
    value: '156',
    change: '+3',
    icon: Package,
  },
];

const lowStockItems = [
  {
    id: '1',
    sku: 'SKU-001',
    name: 'Wireless Headphones',
    category: 'Electronics',
    currentStock: 5,
    minStock: 10,
    location: 'Warehouse A',
  },
  {
    id: '2',
    sku: 'SKU-002',
    name: 'Coffee Maker',
    category: 'Appliances',
    currentStock: 2,
    minStock: 8,
    location: 'Warehouse B',
  },
  {
    id: '3',
    sku: 'SKU-003',
    name: 'Desk Chair',
    category: 'Furniture',
    currentStock: 1,
    minStock: 5,
    location: 'Store NYC',
  },
];

interface NewProductForm {
  name: string;
  sku: string;
  category: string;
  description: string;
  price: string;
  cost: string;
  initialStock: string;
  minStock: string;
  location: string;
}

const categoryOptions = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'toys', label: 'Toys' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'beauty', label: 'Beauty & Personal Care' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'other', label: 'Other' },
];

const locationOptions = [
  { value: 'warehouse-a', label: 'Warehouse A' },
  { value: 'warehouse-b', label: 'Warehouse B' },
  { value: 'store-nyc', label: 'Store NYC' },
  { value: 'store-la', label: 'Store LA' },
  { value: 'store-chicago', label: 'Store Chicago' },
];

export function InventoryPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState<NewProductForm>({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    initialStock: '',
    minStock: '',
    location: '',
  });

  const handleAddProduct = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Reset form when closing
    setNewProductForm({
      name: '',
      sku: '',
      category: '',
      description: '',
      price: '',
      cost: '',
      initialStock: '',
      minStock: '',
      location: '',
    });
  };

  const handleFormChange = (field: keyof NewProductForm, value: string) => {
    setNewProductForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate SKU from name
    if (field === 'name') {
      const sku = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 20);
      setNewProductForm((prev) => ({
        ...prev,
        sku: `SKU-${sku}`,
      }));
    }
  };

  const handleCreateProduct = () => {
    // Validate form
    if (
      !newProductForm.name.trim() ||
      !newProductForm.category ||
      !newProductForm.location
    ) {
      return;
    }

    // Here you would typically make an API call to create the product
    console.log('Creating product:', newProductForm);

    // Close drawer and reset form
    handleCloseDrawer();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Monitor inventory levels and manage stock across all locations
          </p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {inventoryMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon
                  className={`h-4 w-4 ${
                    metric.variant === 'warning'
                      ? 'text-yellow-600'
                      : 'text-muted-foreground'
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      metric.variant === 'warning'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }
                  >
                    {metric.change}
                  </span>
                  {' from last month'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              Items that need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.sku} • {item.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="warning">
                      {item.currentStock} / {item.minStock}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Stock Level
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Movements</CardTitle>
            <CardDescription>Latest inventory transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Incoming shipment</p>
                  <p className="text-xs text-muted-foreground">Warehouse A</p>
                </div>
                <div className="text-right">
                  <Badge variant="success">+250</Badge>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sale transaction</p>
                  <p className="text-xs text-muted-foreground">Store NYC</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">-15</Badge>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Stock adjustment</p>
                  <p className="text-xs text-muted-foreground">Warehouse B</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">-5</Badge>
                  <p className="text-xs text-muted-foreground">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Product Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title="Add New Product"
        description="Create a new product in your inventory"
        size="lg"
      >
        <DrawerContent>
          <div className="space-y-6">
            {/* Product Name */}
            <div className="space-y-2">
              <label
                htmlFor="product-name"
                className="text-sm font-medium text-foreground"
              >
                Product Name *
              </label>
              <Input
                id="product-name"
                placeholder="Enter product name"
                value={newProductForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <label
                htmlFor="product-sku"
                className="text-sm font-medium text-foreground"
              >
                SKU *
              </label>
              <Input
                id="product-sku"
                placeholder="SKU-PRODUCT-NAME"
                value={newProductForm.sku}
                onChange={(e) => handleFormChange('sku', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Stock Keeping Unit - unique identifier for the product
              </p>
            </div>

            {/* Category and Location Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="product-category"
                  className="text-sm font-medium text-foreground"
                >
                  Category *
                </label>
                <Select
                  value={newProductForm.category}
                  options={categoryOptions}
                  onChange={(value) =>
                    handleFormChange('category', value as string)
                  }
                  placeholder="Select category"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="product-location"
                  className="text-sm font-medium text-foreground"
                >
                  Location *
                </label>
                <Select
                  value={newProductForm.location}
                  options={locationOptions}
                  onChange={(value) =>
                    handleFormChange('location', value as string)
                  }
                  placeholder="Select location"
                />
              </div>
            </div>

            {/* Price and Cost Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="product-price"
                  className="text-sm font-medium text-foreground"
                >
                  Sale Price
                </label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newProductForm.price}
                  onChange={(e) => handleFormChange('price', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="product-cost"
                  className="text-sm font-medium text-foreground"
                >
                  Cost
                </label>
                <Input
                  id="product-cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newProductForm.cost}
                  onChange={(e) => handleFormChange('cost', e.target.value)}
                />
              </div>
            </div>

            {/* Stock Levels Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="product-initial-stock"
                  className="text-sm font-medium text-foreground"
                >
                  Initial Stock
                </label>
                <Input
                  id="product-initial-stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newProductForm.initialStock}
                  onChange={(e) =>
                    handleFormChange('initialStock', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="product-min-stock"
                  className="text-sm font-medium text-foreground"
                >
                  Minimum Stock Level
                </label>
                <Input
                  id="product-min-stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newProductForm.minStock}
                  onChange={(e) => handleFormChange('minStock', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Alert when stock falls below this level
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="product-description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="product-description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter product description (optional)"
                value={newProductForm.description}
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
            onClick={handleCreateProduct}
            disabled={
              !newProductForm.name.trim() ||
              !newProductForm.category ||
              !newProductForm.location
            }
          >
            Create Product
          </Button>
        </DrawerFooter>
      </Drawer>
    </div>
  );
}
