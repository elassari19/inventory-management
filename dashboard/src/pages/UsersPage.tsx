import { useState } from 'react';
import { Plus, Search, Filter, Shield, Edit, Trash2 } from 'lucide-react';
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
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Modal, ModalContent, ModalFooter } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useToast } from '../components/ui/ToastProvider';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  avatar?: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@acme.com',
    role: 'tenant_admin',
    tenant: 'Acme Corporation',
    status: 'active',
    lastLogin: '2 hours ago',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@techstart.com',
    role: 'manager',
    tenant: 'TechStart Inc',
    status: 'active',
    lastLogin: '1 day ago',
  },
  {
    id: '3',
    name: 'Mike Brown',
    email: 'mike.brown@global.com',
    role: 'user',
    tenant: 'Global Retail',
    status: 'inactive',
    lastLogin: '1 week ago',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@acme.com',
    role: 'viewer',
    tenant: 'Acme Corporation',
    status: 'active',
    lastLogin: '3 hours ago',
  },
];

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'tenant_admin', label: 'Tenant Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'destructive';
    case 'tenant_admin':
      return 'default';
    case 'manager':
      return 'secondary';
    case 'user':
      return 'outline';
    case 'viewer':
      return 'outline';
    default:
      return 'outline';
  }
};

export function UsersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: mockUsers.length,
  });

  // In a real app, this would use the GraphQL hooks
  // const { data: usersData, loading, error } = useUsers();
  // const [createUser] = useCreateUser();
  // const [updateUser] = useUpdateUser();

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<User>[] = [
    {
      key: 'name',
      title: 'User',
      sortable: true,
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">
              {record.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
          </div>
          <div>
            <p className="font-medium">{record.name}</p>
            <p className="text-sm text-muted-foreground">{record.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value) => (
        <Badge variant={getRoleBadgeVariant(value)}>
          <Shield className="mr-1 h-3 w-3" />
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'tenant',
      title: 'Tenant',
      sortable: true,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'active' ? 'success' : 'secondary'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      title: 'Last Login',
      sortable: true,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditUser(record)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(record.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (_userId: string) => {
    toast({
      title: 'User Deleted',
      description: 'User has been successfully deleted.',
      type: 'success',
    });
  };

  const handleCreateUser = () => {
    setIsCreateModalOpen(false);
    toast({
      title: 'User Created',
      description: 'New user has been successfully created.',
      type: 'success',
    });
  };

  const handleUpdateUser = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    toast({
      title: 'User Updated',
      description: 'User information has been successfully updated.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions across all tenants
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              placeholder="All roles"
              options={[{ value: 'all', label: 'All Roles' }, ...roleOptions]}
            />
            <Select
              placeholder="All statuses"
              options={[
                { value: 'all', label: 'All Statuses' },
                ...statusOptions,
              ]}
            />
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredUsers}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page, pageSize) => {
                setPagination((prev) => ({ ...prev, current: page, pageSize }));
              },
            }}
            rowSelection={{
              selectedRowKeys: selectedUsers,
              onChange: (selectedRowKeys) => {
                setSelectedUsers(selectedRowKeys as string[]);
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
        description="Add a new user to the system"
        size="lg"
      >
        <ModalContent>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input placeholder="Enter user name" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <Input placeholder="Enter email address" type="email" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Role</label>
              <Select options={roleOptions} placeholder="Select role" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tenant</label>
              <Select
                options={[
                  { value: 'acme', label: 'Acme Corporation' },
                  { value: 'techstart', label: 'TechStart Inc' },
                  { value: 'global', label: 'Global Retail' },
                ]}
                placeholder="Select tenant"
              />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateUser}>Create User</Button>
        </ModalFooter>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        description="Update user information"
        size="lg"
      >
        <ModalContent>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <Input defaultValue={editingUser.name} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email</label>
                <Input defaultValue={editingUser.email} type="email" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Role</label>
                <Select options={roleOptions} value={editingUser.role} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select options={statusOptions} value={editingUser.status} />
              </div>
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateUser}>Update User</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
