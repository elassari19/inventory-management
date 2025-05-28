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

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
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
      name
      description
      sku
      barcode
      price
      cost
      minStock
      maxStock
      isActive
      category {
        id
        name
      }
      brand {
        id
        name
      }
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!, $tenantId: ID!) {
    product(id: $id, tenantId: $tenantId) {
      id
      name
      description
      sku
      barcode
      price
      cost
      minStock
      maxStock
      isActive
      category {
        id
        name
      }
      brand {
        id
        name
      }
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

// Product Mutations
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      sku
      barcode
      price
      cost
      minStock
      maxStock
      isActive
      category {
        id
        name
      }
      brand {
        id
        name
      }
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      sku
      barcode
      price
      cost
      minStock
      maxStock
      isActive
      category {
        id
        name
      }
      brand {
        id
        name
      }
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!, $tenantId: ID!) {
    deleteProduct(id: $id, tenantId: $tenantId) {
      success
    }
  }
`;

// Category Queries
export const GET_CATEGORIES = gql`
  query GetCategories(
    $tenantId: ID!
    $search: String
    $limit: Int
    $offset: Int
  ) {
    categories(
      tenantId: $tenantId
      search: $search
      limit: $limit
      offset: $offset
    ) {
      id
      name
      description
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      description
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      description
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!, $tenantId: ID!) {
    deleteCategory(id: $id, tenantId: $tenantId) {
      success
    }
  }
`;

// Brand Queries
export const GET_BRANDS = gql`
  query GetBrands($tenantId: ID!, $search: String, $limit: Int, $offset: Int) {
    brands(
      tenantId: $tenantId
      search: $search
      limit: $limit
      offset: $offset
    ) {
      id
      name
      description
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_BRAND = gql`
  mutation CreateBrand($input: CreateBrandInput!) {
    createBrand(input: $input) {
      id
      name
      description
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_BRAND = gql`
  mutation UpdateBrand($id: ID!, $input: UpdateBrandInput!) {
    updateBrand(id: $id, input: $input) {
      id
      name
      description
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_BRAND = gql`
  mutation DeleteBrand($id: ID!, $tenantId: ID!) {
    deleteBrand(id: $id, tenantId: $tenantId) {
      success
    }
  }
`;

// Location Queries
export const GET_LOCATIONS = gql`
  query GetLocations(
    $tenantId: ID!
    $search: String
    $limit: Int
    $offset: Int
  ) {
    locations(
      tenantId: $tenantId
      search: $search
      limit: $limit
      offset: $offset
    ) {
      id
      name
      description
      type
      address
      isActive
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_LOCATION = gql`
  mutation CreateLocation($input: CreateLocationInput!) {
    createLocation(input: $input) {
      id
      name
      description
      type
      address
      isActive
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_LOCATION = gql`
  mutation UpdateLocation($id: ID!, $input: UpdateLocationInput!) {
    updateLocation(id: $id, input: $input) {
      id
      name
      description
      type
      address
      isActive
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_LOCATION = gql`
  mutation DeleteLocation($id: ID!, $tenantId: ID!) {
    deleteLocation(id: $id, tenantId: $tenantId) {
      success
    }
  }
`;

// Inventory Queries
export const GET_INVENTORY = gql`
  query GetInventory(
    $tenantId: ID!
    $locationId: ID
    $productId: ID
    $limit: Int
    $offset: Int
  ) {
    inventory(
      tenantId: $tenantId
      locationId: $locationId
      productId: $productId
      limit: $limit
      offset: $offset
    ) {
      id
      quantity
      reservedQuantity
      product {
        id
        name
        sku
        barcode
        price
        cost
        minStock
        maxStock
      }
      location {
        id
        name
        type
      }
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($id: ID!, $input: UpdateInventoryInput!) {
    updateInventory(id: $id, input: $input) {
      id
      quantity
      reservedQuantity
      product {
        id
        name
        sku
        barcode
      }
      location {
        id
        name
        type
      }
      tenant {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

// Transaction Queries
export const GET_TRANSACTIONS = gql`
  query GetTransactions(
    $tenantId: ID!
    $type: TransactionType
    $locationId: ID
    $productId: ID
    $limit: Int
    $offset: Int
  ) {
    transactions(
      tenantId: $tenantId
      type: $type
      locationId: $locationId
      productId: $productId
      limit: $limit
      offset: $offset
    ) {
      id
      type
      quantity
      previousQuantity
      newQuantity
      reason
      notes
      product {
        id
        name
        sku
        barcode
      }
      location {
        id
        name
        type
      }
      user {
        id
        firstName
        lastName
        email
      }
      tenant {
        id
        name
      }
      createdAt
    }
  }
`;

export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      id
      type
      quantity
      previousQuantity
      newQuantity
      reason
      notes
      product {
        id
        name
        sku
        barcode
      }
      location {
        id
        name
        type
      }
      user {
        id
        firstName
        lastName
        email
      }
      tenant {
        id
        name
      }
      createdAt
    }
  }
`;

// Analytics Queries
export const GET_ANALYTICS_OVERVIEW = gql`
  query GetAnalyticsOverview(
    $tenantId: ID!
    $locationId: ID
    $dateRange: DateRangeInput
  ) {
    analyticsOverview(
      tenantId: $tenantId
      locationId: $locationId
      dateRange: $dateRange
    ) {
      totalProducts
      totalLocations
      totalValue
      lowStockCount
      outOfStockCount
      recentTransactions
      topMovingProducts {
        product {
          id
          name
          sku
        }
        totalQuantity
        totalTransactions
      }
    }
  }
`;

export const GET_STOCK_ALERTS = gql`
  query GetStockAlerts(
    $tenantId: ID!
    $locationId: ID
    $type: AlertType
    $limit: Int
    $offset: Int
  ) {
    stockAlerts(
      tenantId: $tenantId
      locationId: $locationId
      type: $type
      limit: $limit
      offset: $offset
    ) {
      id
      type
      message
      isResolved
      product {
        id
        name
        sku
        barcode
        minStock
        maxStock
      }
      location {
        id
        name
        type
      }
      inventory {
        id
        quantity
        reservedQuantity
      }
      tenant {
        id
        name
      }
      createdAt
      resolvedAt
    }
  }
`;

export const RESOLVE_STOCK_ALERT = gql`
  mutation ResolveStockAlert($id: ID!, $tenantId: ID!) {
    resolveStockAlert(id: $id, tenantId: $tenantId) {
      id
      isResolved
      resolvedAt
    }
  }
`;

// Barcode Scanning (for web if needed)
export const SCAN_BARCODE = gql`
  mutation ScanBarcode($barcode: String!, $tenantId: ID!) {
    scanBarcode(barcode: $barcode, tenantId: $tenantId) {
      product {
        id
        name
        sku
        barcode
        price
        cost
        category {
          id
          name
        }
        brand {
          id
          name
        }
      }
      inventory {
        id
        quantity
        reservedQuantity
        location {
          id
          name
          type
        }
      }
    }
  }
`;

// Subscriptions for real-time updates
export const INVENTORY_UPDATED_SUBSCRIPTION = gql`
  subscription InventoryUpdated($tenantId: ID!, $locationId: ID) {
    inventoryUpdated(tenantId: $tenantId, locationId: $locationId) {
      id
      quantity
      reservedQuantity
      product {
        id
        name
        sku
        barcode
      }
      location {
        id
        name
        type
      }
      tenant {
        id
        name
      }
      updatedAt
    }
  }
`;

export const TRANSACTION_CREATED_SUBSCRIPTION = gql`
  subscription TransactionCreated($tenantId: ID!, $locationId: ID) {
    transactionCreated(tenantId: $tenantId, locationId: $locationId) {
      id
      type
      quantity
      product {
        id
        name
        sku
        barcode
      }
      location {
        id
        name
        type
      }
      user {
        id
        firstName
        lastName
      }
      tenant {
        id
        name
      }
      createdAt
    }
  }
`;

export const STOCK_ALERT_CREATED_SUBSCRIPTION = gql`
  subscription StockAlertCreated($tenantId: ID!, $locationId: ID) {
    stockAlertCreated(tenantId: $tenantId, locationId: $locationId) {
      id
      type
      message
      product {
        id
        name
        sku
        barcode
      }
      location {
        id
        name
        type
      }
      inventory {
        id
        quantity
        reservedQuantity
      }
      tenant {
        id
        name
      }
      createdAt
    }
  }
`;
