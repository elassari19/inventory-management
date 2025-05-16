import { GraphQLScalarType, Kind } from 'graphql';
import { repositories } from '../db/repositories';
import { InventoryService } from '../services/inventory.service';
import { AuthService } from '../auth/auth.service';
import {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express';

// Define JSON scalar type for handling JSON fields
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      // Convert ObjectValueNode to a plain JavaScript object
      const obj = {};
      // Handle ObjectValueNode properties if needed
      return obj;
    }
    return null;
  },
});

// Helper function to check if user has access to tenant
const checkTenantAccess = async (userId, tenantId) => {
  // Owner check
  const tenant = await repositories.tenants.findById(tenantId);
  if (!tenant) {
    throw new UserInputError('Tenant not found');
  }

  if (tenant.owner_id === userId) {
    return true;
  }

  // Tenant user check
  const tenantUser = await repositories.tenantUsers.findByTenantAndUser(
    tenantId,
    userId
  );
  if (!tenantUser) {
    return false;
  }

  return true;
};

export const resolvers = {
  // Define scalar
  JSON: JSONScalar,

  // Queries
  Query: {
    // User queries
    me: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      return repositories.users.findById(user.id);
    },

    user: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      return repositories.users.findById(id);
    },

    // Tenant queries
    myTenants: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      return repositories.tenants.findUserTenants(user.id);
    },

    tenant: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, id))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      return repositories.tenants.findById(id);
    },

    currentTenant: async (_, __, { user, tenant }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!tenant) {
        return null;
      }

      return repositories.tenants.findById(tenant.id);
    },

    tenantUsers: async (_, { tenantId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      return repositories.tenantUsers.findTenantUsers(tenantId);
    },

    // Product queries
    products: async (
      _,
      { tenantId, categoryId, brandId, search, limit, offset },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      // If search is provided, use the search function
      if (search) {
        return repositories.products.searchProducts(tenantId, search, {
          categoryId,
          brandId,
          limit,
          offset,
        });
      }

      // Build query options
      const options = { limit, offset };
      let whereConditions = { tenant_id: tenantId };

      if (categoryId) {
        whereConditions['category_id'] = categoryId;
      }

      if (brandId) {
        whereConditions['brand_id'] = brandId;
      }

      return repositories.products.findAll(tenantId, options);
    },

    product: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const product = await repositories.products.findById(id);

      if (!product) {
        throw new UserInputError('Product not found');
      }

      if (!(await checkTenantAccess(user.id, product.tenant_id))) {
        throw new ForbiddenError('Access denied to this product');
      }

      return product;
    },

    productByBarcode: async (_, { tenantId, barcode }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      const product = await repositories.products.findByBarcode(
        barcode,
        tenantId
      );

      if (!product) {
        throw new UserInputError('Product with this barcode not found');
      }

      return product;
    },

    // Category queries
    categories: async (_, { tenantId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      return repositories.categories.findAll(tenantId);
    },

    category: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const category = await repositories.categories.findById(id);

      if (!category) {
        throw new UserInputError('Category not found');
      }

      if (!(await checkTenantAccess(user.id, category.tenant_id))) {
        throw new ForbiddenError('Access denied to this category');
      }

      return category;
    },

    // Brand queries
    brands: async (_, { tenantId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      return repositories.brands.findAll(tenantId);
    },

    brand: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const brand = await repositories.brands.findById(id);

      if (!brand) {
        throw new UserInputError('Brand not found');
      }

      if (!(await checkTenantAccess(user.id, brand.tenant_id))) {
        throw new ForbiddenError('Access denied to this brand');
      }

      return brand;
    },

    // Location queries
    locations: async (_, { tenantId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      return repositories.locations.findAll(tenantId);
    },

    location: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const location = await repositories.locations.findById(id);

      if (!location) {
        throw new UserInputError('Location not found');
      }

      if (!(await checkTenantAccess(user.id, location.tenant_id))) {
        throw new ForbiddenError('Access denied to this location');
      }

      return location;
    },

    // Device queries
    devices: async (_, { tenantId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      return repositories.devices.findAll(tenantId);
    },

    device: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const device = await repositories.devices.findById(id);

      if (!device) {
        throw new UserInputError('Device not found');
      }

      if (!(await checkTenantAccess(user.id, device.tenant_id))) {
        throw new ForbiddenError('Access denied to this device');
      }

      return device;
    },

    // Inventory transaction queries
    inventoryTransactions: async (
      _,
      {
        tenantId,
        productId,
        deviceId,
        userId,
        transactionType,
        startDate,
        endDate,
        limit,
        offset,
      },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      // Build base query
      let query = 'SELECT * FROM inventory_transactions WHERE tenant_id = $1';
      const params = [tenantId];
      let paramIndex = 2;

      // Add filters
      if (productId) {
        query += ` AND product_id = $${paramIndex++}`;
        params.push(productId);
      }

      if (deviceId) {
        query += ` AND device_id = $${paramIndex++}`;
        params.push(deviceId);
      }

      if (userId) {
        query += ` AND performed_by = $${paramIndex++}`;
        params.push(userId);
      }

      if (transactionType) {
        query += ` AND transaction_type = $${paramIndex++}`;
        params.push(transactionType);
      }

      if (startDate && endDate) {
        query += ` AND created_at BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        params.push(startDate, endDate);
      }

      // Add order, limit, offset
      query += ' ORDER BY created_at DESC';

      if (limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(limit);
      }

      if (offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(offset);
      }

      // Execute query
      return repositories.inventoryTransactions.executeQuery(query, params);
    },

    inventoryTransaction: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const transaction = await repositories.inventoryTransactions.findById(id);

      if (!transaction) {
        throw new UserInputError('Inventory transaction not found');
      }

      if (!(await checkTenantAccess(user.id, transaction.tenant_id))) {
        throw new ForbiddenError('Access denied to this transaction');
      }

      return transaction;
    },

    // Analytics queries
    productStockLevels: async (
      _,
      { tenantId, belowReorderPoint },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      if (belowReorderPoint) {
        return InventoryService.getProductsBelowReorderPoint(tenantId);
      }

      // Get all products with stock levels
      return repositories.products.findAll(tenantId);
    },

    inventoryValueReport: async (_, { tenantId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      return InventoryService.getInventoryValueReport(tenantId);
    },

    transactionSummary: async (
      _,
      { tenantId, startDate, endDate, groupBy },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      // Default dates if not provided
      const defaultDays = 30;
      const endDateValue = endDate || new Date().toISOString();
      const startDateValue =
        startDate ||
        new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000).toISOString();

      return InventoryService.getTransactionSummary(
        tenantId,
        startDateValue,
        endDateValue,
        groupBy
      );
    },
  },

  // Type resolvers
  User: {
    tenants: async (parent) => {
      return repositories.tenants.findUserTenants(parent.id);
    },

    subscription: async (parent) => {
      // Query for user's subscription
      const query = 'SELECT * FROM subscriptions WHERE user_id = $1 LIMIT 1';
      const result = await repositories.tenants.executeQuery(query, [
        parent.id,
      ]);
      return result[0] || null;
    },

    currentTenant: async (parent, _, { tenant }) => {
      if (!tenant) {
        return null;
      }

      return repositories.tenants.findById(tenant.id);
    },
  },

  Tenant: {
    owner: async (parent) => {
      return repositories.users.findById(parent.owner_id);
    },

    users: async (parent) => {
      return repositories.tenantUsers.findTenantUsers(parent.id);
    },

    products: async (parent) => {
      return repositories.products.findAll(parent.id);
    },

    categories: async (parent) => {
      return repositories.categories.findAll(parent.id);
    },

    brands: async (parent) => {
      return repositories.brands.findAll(parent.id);
    },

    locations: async (parent) => {
      return repositories.locations.findAll(parent.id);
    },

    devices: async (parent) => {
      return repositories.devices.findAll(parent.id);
    },

    inventoryTransactions: async (parent) => {
      return repositories.inventoryTransactions.findAll(parent.id);
    },
  },

  TenantUser: {
    user: async (parent) => {
      return repositories.users.findById(parent.user_id);
    },

    tenant: async (parent) => {
      return repositories.tenants.findById(parent.tenant_id);
    },
  },

  Product: {
    category: async (parent) => {
      if (!parent.category_id) {
        return null;
      }

      return repositories.categories.findById(parent.category_id);
    },

    brand: async (parent) => {
      if (!parent.brand_id) {
        return null;
      }

      return repositories.brands.findById(parent.brand_id);
    },

    tenant: async (parent) => {
      return repositories.tenants.findById(parent.tenant_id);
    },

    inventoryTransactions: async (parent) => {
      return repositories.inventoryTransactions.findByProduct(
        parent.id,
        parent.tenant_id
      );
    },
  },

  Category: {
    parent: async (parent) => {
      if (!parent.parent_id) {
        return null;
      }

      return repositories.categories.findById(parent.parent_id);
    },

    children: async (parent) => {
      const query =
        'SELECT * FROM categories WHERE parent_id = $1 AND tenant_id = $2';
      return repositories.categories.executeQuery(query, [
        parent.id,
        parent.tenant_id,
      ]);
    },

    tenant: async (parent) => {
      return repositories.tenants.findById(parent.tenant_id);
    },

    products: async (parent) => {
      const query =
        'SELECT * FROM products WHERE category_id = $1 AND tenant_id = $2';
      return repositories.products.executeQuery(query, [
        parent.id,
        parent.tenant_id,
      ]);
    },
  },

  Brand: {
    tenant: async (parent) => {
      return repositories.tenants.findById(parent.tenant_id);
    },

    products: async (parent) => {
      const query =
        'SELECT * FROM products WHERE brand_id = $1 AND tenant_id = $2';
      return repositories.products.executeQuery(query, [
        parent.id,
        parent.tenant_id,
      ]);
    },
  },

  Location: {
    tenant: async (parent) => {
      return repositories.tenants.findById(parent.tenant_id);
    },

    inventoryTransactions: async (parent) => {
      const query = `
        SELECT * FROM inventory_transactions 
        WHERE (source_location_id = $1 OR destination_location_id = $1) AND tenant_id = $2
        ORDER BY created_at DESC
      `;
      return repositories.inventoryTransactions.executeQuery(query, [
        parent.id,
        parent.tenant_id,
      ]);
    },
  },

  Device: {
    tenant: async (parent) => {
      return repositories.tenants.findById(parent.tenant_id);
    },

    registeredBy: async (parent) => {
      if (!parent.registered_by) {
        return null;
      }

      return repositories.users.findById(parent.registered_by);
    },
  },

  InventoryTransaction: {
    product: async (parent) => {
      return repositories.products.findById(parent.product_id);
    },

    sourceLocation: async (parent) => {
      if (!parent.source_location_id) {
        return null;
      }

      return repositories.locations.findById(parent.source_location_id);
    },

    destinationLocation: async (parent) => {
      if (!parent.destination_location_id) {
        return null;
      }

      return repositories.locations.findById(parent.destination_location_id);
    },

    performedBy: async (parent) => {
      if (!parent.performed_by) {
        return null;
      }

      return repositories.users.findById(parent.performed_by);
    },

    device: async (parent) => {
      if (!parent.device_id) {
        return null;
      }

      return repositories.devices.findById(parent.device_id);
    },

    tenant: async (parent) => {
      return repositories.tenants.findById(parent.tenant_id);
    },

    auditRecord: async (parent) => {
      const query =
        'SELECT * FROM audit_records WHERE transaction_id = $1 LIMIT 1';
      const result = await repositories.auditRecords.executeQuery(query, [
        parent.id,
      ]);
      return result[0] || null;
    },
  },

  AuditRecord: {
    transaction: async (parent) => {
      return repositories.inventoryTransactions.findById(parent.transaction_id);
    },

    device: async (parent) => {
      if (!parent.device_id) {
        return null;
      }

      return repositories.devices.findById(parent.device_id);
    },

    user: async (parent) => {
      if (!parent.user_id) {
        return null;
      }

      return repositories.users.findById(parent.user_id);
    },
  },

  // Mutations
  Mutation: {
    // Auth mutations
    login: async (_, { email, password }) => {
      try {
        // Use validateUser instead of login since that's what's available in AuthService
        const user = await AuthService.validateUser(email, password);
        if (!user) {
          throw new AuthenticationError('Invalid email or password');
        }

        // Generate a token for the user
        const token = await AuthService.generateToken(user);

        return {
          token,
          user,
        };
      } catch (error) {
        throw new AuthenticationError('Login failed: ' + error.message);
      }
    },

    register: async (_, { email, password, name }) => {
      try {
        // Create user data object matching what the register method expects
        const userData = { email, password, name };
        const user = await AuthService.register(userData);

        // Generate a token for the new user
        const token = await AuthService.generateToken(user);

        return {
          token,
          user,
        };
      } catch (error) {
        throw new UserInputError('Registration failed: ' + error.message);
      }
    },

    selectTenant: async (_, { tenantId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Since selectTenant isn't defined in AuthService, we implement it here
        // Check if user has access to the tenant
        const hasAccess = await checkTenantAccess(user.id, tenantId);

        if (!hasAccess) {
          throw new ForbiddenError('You do not have access to this tenant');
        }

        // Generate a token with tenant context
        const token = await AuthService.generateToken(user, tenantId);

        return {
          token,
          user,
        };
      } catch (error) {
        throw new UserInputError('Failed to select tenant: ' + error.message);
      }
    },

    // Tenant mutations
    createTenant: async (_, { name, type }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const newTenant = {
        name,
        type,
        owner_id: user.id,
      };

      return repositories.tenants.create(newTenant);
    },

    updateTenant: async (_, { id, name, type }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const tenant = await repositories.tenants.findById(id);
      if (!tenant) {
        throw new UserInputError('Tenant not found');
      }

      // Only owner can update tenant
      if (tenant.owner_id !== user.id) {
        throw new ForbiddenError('Only the owner can update the tenant');
      }

      const updates: Record<string, any> = {};
      if (name !== undefined) updates.name = name;
      if (type !== undefined) updates.type = type;

      return repositories.tenants.update(id, updates);
    },

    deleteTenant: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const tenant = await repositories.tenants.findById(id);
      if (!tenant) {
        throw new UserInputError('Tenant not found');
      }

      // Only owner can delete tenant
      if (tenant.owner_id !== user.id) {
        throw new ForbiddenError('Only the owner can delete the tenant');
      }

      // Delete the tenant
      await repositories.tenants.delete(id);
      return true;
    },

    // Specialized inventory operations
    stockReceipt: async (
      _,
      { tenantId, productId, quantity, locationId, notes },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      const result = await InventoryService.stockReceipt(
        tenantId,
        productId,
        quantity,
        locationId,
        notes,
        user.id
      );

      return result.transaction;
    },

    stockAdjustment: async (
      _,
      { tenantId, productId, quantity, locationId, reason },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      const result = await InventoryService.stockAdjustment(
        tenantId,
        productId,
        quantity,
        locationId,
        reason,
        user.id
      );

      return result.transaction;
    },

    transferStock: async (
      _,
      {
        tenantId,
        productId,
        quantity,
        sourceLocationId,
        destinationLocationId,
        notes,
      },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      const result = await InventoryService.transferStock(
        tenantId,
        productId,
        quantity,
        sourceLocationId,
        destinationLocationId,
        notes,
        user.id
      );

      return result.transaction;
    },

    recordSale: async (
      _,
      { tenantId, productId, quantity, locationId },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!(await checkTenantAccess(user.id, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      const result = await InventoryService.recordSale(
        tenantId,
        productId,
        quantity,
        locationId,
        user.id
      );

      return result.transaction;
    },

    scanProductBarcode: async (
      _,
      { tenantId, barcode, quantity, transactionType, locationId, notes },
      { user, device }
    ) => {
      // This can be called by either a logged-in user or an authenticated device
      const performedBy = user?.id;
      const deviceId = device?.id;

      if (!performedBy && !deviceId) {
        throw new AuthenticationError('Not authenticated');
      }

      // If user is authenticated, check tenant access
      if (performedBy && !(await checkTenantAccess(performedBy, tenantId))) {
        throw new ForbiddenError('Access denied to this tenant');
      }

      // If device is authenticated, check tenant access
      if (deviceId) {
        const deviceRecord = await repositories.devices.findById(deviceId);
        if (!deviceRecord || deviceRecord.tenant_id !== tenantId) {
          throw new ForbiddenError(
            'Device does not have access to this tenant'
          );
        }

        // Update device last seen timestamp
        await repositories.devices.updateLastSeen(deviceId);
      }

      const result = await InventoryService.scanProductBarcode(
        tenantId,
        barcode,
        quantity,
        transactionType,
        locationId,
        notes,
        performedBy,
        deviceId
      );

      return result.transaction;
    },
  },
};
