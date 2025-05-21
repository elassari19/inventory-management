// Include barcode scanning type definitions
import { typeDefs as barcodeScanTypeDefs } from './barcodeScan';

import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  # Core types
  type User {
    id: ID!
    email: String!
    name: String
    createdAt: String!
    subscription: Subscription
    tenants: [Tenant!]
    currentTenant: Tenant
  }

  type Subscription {
    id: ID!
    plan: String!
    status: String!
    startDate: String!
    endDate: String!
    requestLimit: Int!
    dataPointLimit: Int!
    requestCount: Int!
    lastResetDate: String!
    userId: String
  }

  # Multi-tenant types
  type Tenant {
    id: ID!
    name: String!
    type: StockType!
    createdAt: String!
    updatedAt: String
    owner: User!
    users: [TenantUser!]
    products: [Product!]
    categories: [Category!]
    brands: [Brand!]
    locations: [Location!]
    devices: [Device!]
    inventoryTransactions: [InventoryTransaction!]
  }

  enum StockType {
    ECOMMERCE
    RESTAURANT
    RETAIL
    WAREHOUSE
    MANUFACTURING
    CUSTOM
  }

  type TenantUser {
    id: ID!
    userId: String!
    user: User!
    tenantId: String!
    tenant: Tenant!
    roles: [String!]!
    createdAt: String!
    updatedAt: String
  }

  # Device management
  type Device {
    id: ID!
    name: String!
    tenantId: String!
    tenant: Tenant!
    lastSeen: String
    registeredBy: User
    status: DeviceStatus!
    createdAt: String!
    updatedAt: String
  }

  enum DeviceStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
  }

  # Inventory management
  type Product {
    id: ID!
    name: String!
    description: String
    sku: String!
    barcode: String
    barcodeType: String
    price: Float
    cost: Float
    quantity: Int!
    reorderPoint: Int
    imageUrl: String
    categoryId: String
    category: Category
    brandId: String
    brand: Brand
    tenantId: String!
    tenant: Tenant!
    createdAt: String!
    updatedAt: String
    customFields: JSON
    inventoryTransactions: [InventoryTransaction!]
  }

  type Category {
    id: ID!
    name: String!
    description: String
    parentId: String
    parent: Category
    children: [Category!]
    tenantId: String!
    tenant: Tenant!
    products: [Product!]
    createdAt: String!
    updatedAt: String
  }

  type Brand {
    id: ID!
    name: String!
    description: String
    logoUrl: String
    tenantId: String!
    tenant: Tenant!
    products: [Product!]
    createdAt: String!
    updatedAt: String
  }

  type Location {
    id: ID!
    name: String!
    description: String
    address: String
    locationType: LocationType!
    tenantId: String!
    tenant: Tenant!
    createdAt: String!
    updatedAt: String
    inventoryTransactions: [InventoryTransaction!]
  }

  enum LocationType {
    WAREHOUSE
    STORE
    RESTAURANT
    SECTION
    SHELF
    OTHER
  }

  type InventoryTransaction {
    id: ID!
    transactionType: TransactionType!
    quantity: Int!
    productId: String!
    product: Product!
    sourceLocationId: String
    sourceLocation: Location
    destinationLocationId: String
    destinationLocation: Location
    performedBy: User
    deviceId: String
    device: Device
    tenantId: String!
    tenant: Tenant!
    createdAt: String!
    notes: String
    customFields: JSON
    auditRecord: AuditRecord
  }

  enum TransactionType {
    STOCK_RECEIPT
    STOCK_ADJUSTMENT
    SALE
    TRANSFER
    RETURN
    STOCK_COUNT
    WASTE
    PRODUCTION
  }

  type AuditRecord {
    id: ID!
    transactionId: String!
    transaction: InventoryTransaction!
    deviceId: String
    device: Device
    userId: String
    user: User
    actionType: String!
    createdAt: String!
    metadata: JSON
  }

  # Custom fields support via JSON scalar
  scalar JSON

  # Queries
  type Query {
    # User queries
    me: User
    user(id: ID!): User

    # Tenant queries
    myTenants: [Tenant!]!
    tenant(id: ID!): Tenant
    currentTenant: Tenant
    tenantUsers(tenantId: ID!): [TenantUser!]!

    # Product queries
    products(
      tenantId: ID!
      categoryId: ID
      brandId: ID
      search: String
      limit: Int
      offset: Int
    ): [Product!]!
    product(id: ID!): Product
    productByBarcode(tenantId: ID!, barcode: String!): Product

    # Category queries
    categories(tenantId: ID!): [Category!]!
    category(id: ID!): Category

    # Brand queries
    brands(tenantId: ID!): [Brand!]!
    brand(id: ID!): Brand

    # Location queries
    locations(tenantId: ID!): [Location!]!
    location(id: ID!): Location

    # Device queries
    devices(tenantId: ID!): [Device!]!
    device(id: ID!): Device

    # Inventory transaction queries
    inventoryTransactions(
      tenantId: ID!
      productId: ID
      deviceId: ID
      userId: ID
      transactionType: TransactionType
      startDate: String
      endDate: String
      limit: Int
      offset: Int
    ): [InventoryTransaction!]!
    inventoryTransaction(id: ID!): InventoryTransaction

    # Analytics and dashboards
    productStockLevels(tenantId: ID!, belowReorderPoint: Boolean): [Product!]!
    inventoryValueReport(tenantId: ID!): InventoryValueReport
    transactionSummary(
      tenantId: ID!
      startDate: String
      endDate: String
      groupBy: String
    ): [TransactionSummary!]!
  }

  # Analytics types
  type InventoryValueReport {
    totalValue: Float!
    totalProducts: Int!
    valueByCategory: [CategoryValue!]!
    tenantId: String!
    generatedAt: String!
  }

  type CategoryValue {
    categoryId: String!
    categoryName: String!
    value: Float!
    productCount: Int!
  }

  type TransactionSummary {
    label: String!
    count: Int!
    totalQuantity: Int!
    transactionType: TransactionType
  }

  # Mutations
  type Mutation {
    # Auth mutations
    login(email: String!, password: String!): AuthPayload
    register(email: String!, password: String!, name: String): AuthPayload
    selectTenant(tenantId: ID!): AuthPayload

    # Tenant mutations
    createTenant(name: String!, type: StockType!): Tenant
    updateTenant(id: ID!, name: String, type: StockType): Tenant
    deleteTenant(id: ID!): Boolean

    # Tenant users mutations
    inviteUserToTenant(
      tenantId: ID!
      email: String!
      roles: [String!]!
    ): TenantUser
    updateTenantUserRoles(
      tenantId: ID!
      userId: ID!
      roles: [String!]!
    ): TenantUser
    removeTenantUser(tenantId: ID!, userId: ID!): Boolean

    # Device mutations
    registerDevice(tenantId: ID!, name: String!): DeviceRegistrationPayload
    updateDevice(id: ID!, name: String, status: DeviceStatus): Device
    deleteDevice(id: ID!): Boolean

    # Product mutations
    createProduct(
      tenantId: ID!
      name: String!
      description: String
      sku: String!
      barcode: String
      barcodeType: String
      price: Float
      cost: Float
      quantity: Int!
      reorderPoint: Int
      imageUrl: String
      categoryId: String
      brandId: String
      customFields: JSON
    ): Product
    updateProduct(
      id: ID!
      name: String
      description: String
      sku: String
      barcode: String
      barcodeType: String
      price: Float
      cost: Float
      reorderPoint: Int
      imageUrl: String
      categoryId: String
      brandId: String
      customFields: JSON
    ): Product
    deleteProduct(id: ID!): Boolean

    # Category mutations
    createCategory(
      tenantId: ID!
      name: String!
      description: String
      parentId: String
    ): Category
    updateCategory(
      id: ID!
      name: String
      description: String
      parentId: String
    ): Category
    deleteCategory(id: ID!): Boolean

    # Brand mutations
    createBrand(
      tenantId: ID!
      name: String!
      description: String
      logoUrl: String
    ): Brand
    updateBrand(
      id: ID!
      name: String
      description: String
      logoUrl: String
    ): Brand
    deleteBrand(id: ID!): Boolean

    # Location mutations
    createLocation(
      tenantId: ID!
      name: String!
      description: String
      address: String
      locationType: LocationType!
    ): Location
    updateLocation(
      id: ID!
      name: String
      description: String
      address: String
      locationType: LocationType
    ): Location
    deleteLocation(id: ID!): Boolean

    # Inventory transaction mutations
    createInventoryTransaction(
      tenantId: ID!
      transactionType: TransactionType!
      quantity: Int!
      productId: ID!
      sourceLocationId: ID
      destinationLocationId: ID
      notes: String
      customFields: JSON
    ): InventoryTransaction

    # Specialized inventory operations
    stockReceipt(
      tenantId: ID!
      productId: ID!
      quantity: Int!
      locationId: ID!
      notes: String
    ): InventoryTransaction
    stockAdjustment(
      tenantId: ID!
      productId: ID!
      quantity: Int!
      locationId: ID!
      reason: String!
    ): InventoryTransaction
    transferStock(
      tenantId: ID!
      productId: ID!
      quantity: Int!
      sourceLocationId: ID!
      destinationLocationId: ID!
      notes: String
    ): InventoryTransaction
    recordSale(
      tenantId: ID!
      productId: ID!
      quantity: Int!
      locationId: ID!
    ): InventoryTransaction

    # Barcode operations (for mobile scanning)
    scanProductBarcode(
      tenantId: ID!
      barcode: String!
      quantity: Int!
      transactionType: TransactionType!
      locationId: ID!
      notes: String
    ): InventoryTransaction
  }

  # Authentication payload
  type AuthPayload {
    token: String!
    user: User!
    tenants: [Tenant!]!
    currentTenant: Tenant
  }

  # Device registration
  type DeviceRegistrationPayload {
    device: Device!
    token: String!
  }
`;
