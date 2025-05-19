# Audit Logging

## Overview

Comprehensive audit logging system for tracking all actions and changes within the system.

## Features

- Detailed activity logging
- Change tracking
- User action history
- Data access logging
- Compliance reporting
- Searchable audit trail
- Log retention policies

## Technical Implementation

- Append-only audit tables
- JSON difference tracking for changes
- Asynchronous log processing
- Structured logging format
- Secure, tamper-evident storage

## Data Models

```
AuditLog {
  id: UUID
  tenantId: UUID
  userId: UUID
  action: String
  entityType: String
  entityId: String
  timestamp: DateTime
  ipAddress: String
  userAgent: String
  changes: JSON
  metadata: JSON
}

AuditLogRetentionPolicy {
  id: UUID
  tenantId: UUID
  retentionDays: Integer
  highPriorityEvents: String[]
}
```

## Audit Event Types

- Authentication events (login, logout, failed attempts)
- Data creation events
- Data modification events
- Data deletion events
- System configuration changes
- Permission changes
- Subscription and billing events
- Export and report generation
- Bulk operations

## Compliance Features

- GDPR compliance support
- Data access tracking
- Retention policy enforcement
- Data export for compliance requests
- Immutable audit trail

## API Endpoints

- GET /api/audit-logs
- GET /api/audit-logs/entity/:entityType/:entityId
- GET /api/audit-logs/user/:userId
- POST /api/audit-logs/export
