# Authentication and User Management

## Overview

Authentication system supporting multi-tenancy with role-based access control, with enhanced device tracking for mobile inventory operations.

## Features

- User registration and authentication
- Device-based authentication for mobile scanning
- Role-based access control
- Session management
- Password reset flows
- Social authentication options
- Two-factor authentication
- Device tracking for audit purposes

## Technical Implementation

- Passport.js for authentication strategies
- JWT token-based auth with refresh token mechanism
- Device ID registration and verification
- Tenant-specific user stores with shared authentication service
- Role-based middleware for API route protection
- Secure device identification for mobile scanning operations

## Data Models

```
User {
  id: UUID
  email: String
  passwordHash: String
  firstName: String
  lastName: String
  phone: String
  address: String
  language: String
  createdAt: DateTime
  updatedAt: DateTime
  lastLogin: DateTime
  status: Enum(ACTIVE, INACTIVE, SUSPENDED)
}

UserRole {
  id: UUID
  userId: UUID (ref: User.id)
  tenantId: UUID
  role: Enum(ADMIN, MANAGER, STAFF, VIEWER)
  permissions: JSON
}

UserDevice {
  id: UUID
  userId: UUID (ref: User.id)
  deviceId: String
  deviceName: String
  deviceModel: String
  platform: String
  osVersion: String
  appVersion: String
  lastUsed: DateTime
  isAuthorized: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}

DeviceSession {
  id: UUID
  deviceId: UUID (ref: UserDevice.id)
  userId: UUID (ref: User.id)
  tenantId: UUID
  token: String
  refreshToken: String
  expiresAt: DateTime
  createdAt: DateTime
  lastActivityAt: DateTime
}
```

## Device Authentication Flow

1. During first login on a mobile device:

   - Collect device information (ID, model, OS)
   - Register device with user account
   - Issue device-specific tokens

2. For subsequent operations:

   - Validate user token + device ID combination
   - Track all operations with device context
   - Allow tenant admins to manage authorized devices

3. For scanning operations:
   - Require valid device authentication
   - Log all scan operations with device context
   - Enable offline scanning with local authentication

## API Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/users/me
- PATCH /api/users/me
- POST /api/auth/register-device
- GET /api/users/devices
- DELETE /api/users/devices/:deviceId
- POST /api/auth/device-login

## Mobile-Specific Authentication

- Biometric authentication option for device access
- Offline authentication capabilities with device-stored credentials
- Automatic device registration during first login
- Device authorization management for organization admins
- Device activity tracking for comprehensive audit trails

## Security Considerations

- Device fingerprinting to prevent spoofing
- Automatic session termination for inactive devices
- Remote device deauthorization for lost/stolen devices
- Granular permissions for device-based operations
- Encrypted storage of device credentials
