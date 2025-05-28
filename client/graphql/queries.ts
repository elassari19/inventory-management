import { gql } from '@apollo/client';

// Authentication Mutations
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        email
        firstName
        lastName
      }
      tenants {
        id
        name
        type
      }
      currentTenant {
        id
        name
        type
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register(
    $email: String!
    $password: String!
    $firstName: String
    $lastName: String
  ) {
    register(
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
    ) {
      token
      refreshToken
      user {
        id
        email
        firstName
        lastName
      }
      tenants {
        id
        name
        type
      }
      currentTenant {
        id
        name
        type
      }
    }
  }
`;

export const SELECT_TENANT_MUTATION = gql`
  mutation SelectTenant($tenantId: ID!) {
    selectTenant(tenantId: $tenantId) {
      token
      refreshToken
      user {
        id
        email
        firstName
        lastName
      }
      currentTenant {
        id
        name
        type
      }
    }
  }
`;

// Product Queries
export const GET_PRODUCTS = gql`
  query GetProducts(
    $tenantId: ID!
    $search: String
    $categoryId: ID
    $brandId: ID
    $limit: Int
    $offset: Int
  ) {
    products(
      tenantId: $tenantId
      search: $search
      categoryId: $categoryId
      brandId: $brandId
      limit: $limit
      offset: $offset
    ) {
      id
      sku
      name
      description
      unitPrice
      reorderPoint
      maxStock
      barcode
      createdAt
      updatedAt
      category {
        id
        name
      }
      brand {
        id
        name
      }
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      sku
      name
      description
      unitPrice
      reorderPoint
      maxStock
      barcode
      images
      tags
      createdAt
      updatedAt
      category {
        id
        name
      }
      brand {
        id
        name
      }
      inventoryTransactions(limit: 10) {
        id
        transactionType
        quantity
        notes
        createdAt
        sourceLocation {
          id
          name
        }
        destinationLocation {
          id
          name
        }
        performedBy {
          id
          email
        }
      }
    }
  }
`;

export const GET_PRODUCT_BY_BARCODE = gql`
  query GetProductByBarcode($tenantId: ID!, $barcode: String!) {
    productByBarcode(tenantId: $tenantId, barcode: $barcode) {
      id
      sku
      name
      description
      unitPrice
      reorderPoint
      maxStock
      barcode
      category {
        id
        name
      }
      brand {
        id
        name
      }
    }
  }
`;

// Category Queries
export const GET_CATEGORIES = gql`
  query GetCategories($tenantId: ID!) {
    categories(tenantId: $tenantId) {
      id
      name
      description
      parentId
      createdAt
    }
  }
`;

// Brand Queries
export const GET_BRANDS = gql`
  query GetBrands($tenantId: ID!) {
    brands(tenantId: $tenantId) {
      id
      name
      description
      createdAt
    }
  }
`;

// Location Queries
export const GET_LOCATIONS = gql`
  query GetLocations($tenantId: ID!) {
    locations(tenantId: $tenantId) {
      id
      name
      description
      type
      address
      createdAt
    }
  }
`;

// Inventory Transaction Queries
export const GET_INVENTORY_TRANSACTIONS = gql`
  query GetInventoryTransactions(
    $tenantId: ID!
    $productId: ID
    $deviceId: ID
    $transactionType: TransactionType
    $limit: Int
    $offset: Int
  ) {
    inventoryTransactions(
      tenantId: $tenantId
      productId: $productId
      deviceId: $deviceId
      transactionType: $transactionType
      limit: $limit
      offset: $offset
    ) {
      id
      transactionType
      quantity
      notes
      createdAt
      product {
        id
        sku
        name
      }
      sourceLocation {
        id
        name
      }
      destinationLocation {
        id
        name
      }
      performedBy {
        id
        email
      }
      device {
        id
        name
      }
    }
  }
`;

// Analytics Queries
export const GET_PRODUCT_STOCK_LEVELS = gql`
  query GetProductStockLevels($tenantId: ID!, $belowReorderPoint: Boolean) {
    productStockLevels(
      tenantId: $tenantId
      belowReorderPoint: $belowReorderPoint
    ) {
      id
      sku
      name
      reorderPoint
      maxStock
      # This would need to be added to the schema
      # currentStock
    }
  }
`;

export const GET_INVENTORY_VALUE_REPORT = gql`
  query GetInventoryValueReport($tenantId: ID!) {
    inventoryValueReport(tenantId: $tenantId) {
      totalValue
      totalProducts
      tenantId
      generatedAt
      valueByCategory {
        categoryId
        categoryName
        value
        productCount
      }
    }
  }
`;

// Mutation Queries
export const STOCK_RECEIPT = gql`
  mutation StockReceipt(
    $tenantId: ID!
    $productId: ID!
    $quantity: Float!
    $locationId: ID!
    $notes: String
  ) {
    stockReceipt(
      tenantId: $tenantId
      productId: $productId
      quantity: $quantity
      locationId: $locationId
      notes: $notes
    ) {
      id
      transactionType
      quantity
      notes
      createdAt
      product {
        id
        sku
        name
      }
      destinationLocation {
        id
        name
      }
    }
  }
`;

export const STOCK_ADJUSTMENT = gql`
  mutation StockAdjustment(
    $tenantId: ID!
    $productId: ID!
    $quantity: Float!
    $locationId: ID!
    $reason: String!
  ) {
    stockAdjustment(
      tenantId: $tenantId
      productId: $productId
      quantity: $quantity
      locationId: $locationId
      reason: $reason
    ) {
      id
      transactionType
      quantity
      notes
      createdAt
      product {
        id
        sku
        name
      }
      destinationLocation {
        id
        name
      }
    }
  }
`;

export const TRANSFER_STOCK = gql`
  mutation TransferStock(
    $tenantId: ID!
    $productId: ID!
    $quantity: Float!
    $sourceLocationId: ID!
    $destinationLocationId: ID!
    $notes: String
  ) {
    transferStock(
      tenantId: $tenantId
      productId: $productId
      quantity: $quantity
      sourceLocationId: $sourceLocationId
      destinationLocationId: $destinationLocationId
      notes: $notes
    ) {
      id
      transactionType
      quantity
      notes
      createdAt
      product {
        id
        sku
        name
      }
      sourceLocation {
        id
        name
      }
      destinationLocation {
        id
        name
      }
    }
  }
`;

export const RECORD_SALE = gql`
  mutation RecordSale(
    $tenantId: ID!
    $productId: ID!
    $quantity: Float!
    $locationId: ID!
  ) {
    recordSale(
      tenantId: $tenantId
      productId: $productId
      quantity: $quantity
      locationId: $locationId
    ) {
      id
      transactionType
      quantity
      createdAt
      product {
        id
        sku
        name
      }
      sourceLocation {
        id
        name
      }
    }
  }
`;

export const SCAN_PRODUCT_BARCODE = gql`
  mutation ScanProductBarcode(
    $tenantId: ID!
    $barcode: String!
    $quantity: Float!
    $transactionType: TransactionType!
    $locationId: ID!
    $notes: String
  ) {
    scanProductBarcode(
      tenantId: $tenantId
      barcode: $barcode
      quantity: $quantity
      transactionType: $transactionType
      locationId: $locationId
      notes: $notes
    ) {
      id
      transactionType
      quantity
      notes
      createdAt
      product {
        id
        sku
        name
        barcode
      }
      sourceLocation {
        id
        name
      }
      destinationLocation {
        id
        name
      }
    }
  }
`;

// Device Authentication
export const DEVICE_LOGIN = gql`
  mutation DeviceLogin(
    $email: String!
    $password: String!
    $deviceId: String!
  ) {
    deviceLogin(email: $email, password: $password, deviceId: $deviceId) {
      accessToken
      refreshToken
      expiresIn
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

export const REGISTER_DEVICE = gql`
  mutation RegisterDevice($deviceInfo: DeviceRegistrationInput!) {
    registerDevice(deviceInfo: $deviceInfo) {
      id
      deviceId
      name
      platform
      isAuthorized
      createdAt
    }
  }
`;

// Fragment definitions for reuse
export const PRODUCT_FRAGMENT = gql`
  fragment ProductInfo on Product {
    id
    sku
    name
    description
    unitPrice
    reorderPoint
    maxStock
    barcode
    createdAt
    updatedAt
    category {
      id
      name
    }
    brand {
      id
      name
    }
  }
`;

export const TRANSACTION_FRAGMENT = gql`
  fragment TransactionInfo on InventoryTransaction {
    id
    transactionType
    quantity
    notes
    createdAt
    product {
      id
      sku
      name
    }
    sourceLocation {
      id
      name
    }
    destinationLocation {
      id
      name
    }
    performedBy {
      id
      email
    }
    device {
      id
      name
    }
  }
`;
