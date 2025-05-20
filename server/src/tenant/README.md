# Tenant Management

This directory contains services and utilities for managing multi-tenant functionality in the Ventory application.

## Components

- `tenant-switching.service.ts` - Handles tenant context switching and management
- `index.ts` - Main exports for the tenant module

## Usage

Import the tenant services directly:

```typescript
import { tenantSwitchingService } from '../tenant';
```

## Functionality

- Tenant switching for authenticated users
- Managing user-tenant associations
- Retrieving available tenants for users
- Checking tenant access permissions
