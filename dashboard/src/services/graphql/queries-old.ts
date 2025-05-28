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
  query GetCategories($tenantId: ID!, $search: String, $limit: Int, $offset: Int) {
    categories(tenantId: $tenantId, search: $search, limit: $limit, offset: $offset) {
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
    brands(tenantId: $tenantId, search: $search, limit: $limit, offset: $offset) {
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
  query GetLocations($tenantId: ID!, $search: String, $limit: Int, $offset: Int) {
    locations(tenantId: $tenantId, search: $search, limit: $limit, offset: $offset) {
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

// Tenant Queries and Mutations
export const GET_TENANTS = gql`
  query GetTenants($filters: TenantFilters, $pagination: PaginationInput) {
    tenants(filters: $filters, pagination: $pagination) {
      data {
        id
        name
        slug
        status
        plan
        domain
        logo
        contactEmail
        createdAt
        updatedAt
        usage {
          users
          storage
          apiCalls
          locations
          products
        }
        limits {
          maxUsers
          maxStorage
          maxApiCalls
          maxLocations
          maxProducts
        }
      }
      pagination {
        page
        limit
        total
        totalPages
      }
    }
  }
`;

export const CREATE_TENANT = gql`
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      id
      name
      slug
      status
      plan
      contactEmail
      createdAt
    }
  }
`;

export const UPDATE_TENANT = gql`
  mutation UpdateTenant($id: ID!, $input: UpdateTenantInput!) {
    updateTenant(id: $id, input: $input) {
      id
      name
      slug
      status
      plan
      domain
      contactEmail
      updatedAt
    }
  }
`;

// Product Queries
export const GET_PRODUCTS = gql`
  query GetProducts($filters: ProductFilters, $pagination: PaginationInput) {
    products(filters: $filters, pagination: $pagination) {
      data {
        id
        sku
        name
        description
        category
        brand
        unitPrice
        currency
        status
        images
        createdAt
        updatedAt
      }
      pagination {
        page
        limit
        total
        totalPages
      }
    }
  }
`;

// Inventory Queries
export const GET_INVENTORY = gql`
  query GetInventory($filters: InventoryFilters, $pagination: PaginationInput) {
    inventory(filters: $filters, pagination: $pagination) {
      data {
        id
        productId
        locationId
        quantity
        reservedQuantity
        availableQuantity
        reorderPoint
        maxStock
        lastCountedAt
        product {
          id
          sku
          name
          category
        }
        location {
          id
          name
          type
        }
      }
      pagination {
        page
        limit
        total
        totalPages
      }
    }
  }
`;

// Dashboard Metrics Query
export const GET_DASHBOARD_METRICS = gql`
  query GetDashboardMetrics {
    dashboardMetrics {
      totalTenants
      activeTenants
      totalUsers
      totalProducts
      totalLocations
      systemHealth {
        status
        uptime
        responseTime
        errorRate
      }
      usage {
        storage {
          used
          total
          percentage
        }
        apiCalls {
          count
          limit
          percentage
        }
      }
    }
  }
`;

// Audit Logs Query
export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($filters: AuditLogFilters, $pagination: PaginationInput) {
    auditLogs(filters: $filters, pagination: $pagination) {
      data {
        id
        action
        resource
        resourceId
        userId
        userEmail
        changes
        metadata
        ipAddress
        userAgent
        timestamp
        tenantId
      }
      pagination {
        page
        limit
        total
        totalPages
      }
    }
  }
`;

// Report Queries and Mutations
export const GET_REPORTS = gql`
  query GetReports($filters: ReportFilters, $pagination: PaginationInput) {
    reports(filters: $filters, pagination: $pagination) {
      data {
        id
        name
        type
        description
        createdBy
        createdAt
        updatedAt
        schedule {
          frequency
          isActive
          nextRunAt
        }
      }
      pagination {
        page
        limit
        total
        totalPages
      }
    }
  }
`;

export const GENERATE_REPORT = gql`
  mutation GenerateReport($input: GenerateReportInput!) {
    generateReport(input: $input) {
      id
      status
      downloadUrl
      generatedAt
    }
  }
`;

// Fragment for common user fields
export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    id
    email
    name
    role
    tenantId
    isActive
    avatar
    lastLoginAt
    createdAt
    updatedAt
  }
`;

// Fragment for common tenant fields
export const TENANT_FRAGMENT = gql`
  fragment TenantFragment on Tenant {
    id
    name
    slug
    status
    plan
    domain
    logo
    contactEmail
    createdAt
    updatedAt
    usage {
      users
      storage
      apiCalls
      locations
      products
    }
    limits {
      maxUsers
      maxStorage
      maxApiCalls
      maxLocations
      maxProducts
    }
  }
`;
