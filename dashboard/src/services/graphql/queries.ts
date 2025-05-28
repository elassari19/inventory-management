import { gql } from '@apollo/client';

// Authentication Mutations
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      user {
        id
        email
        name
        role
        tenantId
        permissions
        avatar
        lastLoginAt
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

// User Queries and Mutations
export const GET_USERS = gql`
  query GetUsers($filters: UserFilters, $pagination: PaginationInput) {
    users(filters: $filters, pagination: $pagination) {
      data {
        id
        email
        name
        role
        tenantId
        isActive
        lastLoginAt
        createdAt
        avatar
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

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      name
      role
      tenantId
      isActive
      createdAt
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
      name
      role
      tenantId
      isActive
      updatedAt
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
