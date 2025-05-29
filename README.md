# Ventory - Multi-tenant Inventory Management SaaS

## Project Overview

Ventory is a multi-tenant inventory management SaaS with mobile app and admin dashboard capabilities. The platform supports various inventory types including e-commerce, restaurants, and libraries with customization options for each tenant.

## Technology Stack

- **Mobile App**: Expo CLI, React Native, Redux Toolkit, Expo Camera, Expo Router
- **Backend**: Express.js, PostgreSQL, Passport.js
- **Additional Services**: Redis for caching, DynamoDB for high-speed metadata

## Multi-tenant Architecture & Security

Ventory implements a comprehensive tenant isolation strategy to ensure data security:

### Database Tenant Isolation

- **Row-Level Security (RLS)** in PostgreSQL ensures tenants can only access their own data
- Tenant context set at the database session level using `set_tenant_id()`
- Automatic tenant filtering on all database operations

### API Tenant Identification

- Tenants identified via subdomain, custom headers, or JWT token claims
- JWT verification for secure tenant context validation
- Rate limiting based on tenant subscription tier

### Cache Isolation

- Redis keys namespaced by tenant ID to prevent cache data leakage
- Tenant-specific Redis service for data caching

### Application-Level Security

- Middleware validation for tenant existence and active status
- JWT token verification with tenant claim validation
- Tenant mismatch detection for additional security

## Getting Started

1. Clone the repository
2. Set up environment variables
3. Run database migrations
4. Start the development server

<!--
sudo lsof -i :5432
sudo kill -9 143
sudo rm /tmp/.s.PGSQL.5432.lock
sudo rm /tmp/.s.PGSQL.5432
brew services start postgresql@15
brew services list
 -->
