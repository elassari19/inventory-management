Backend Structure (Express.js + GraphQL)

server/
├── src/
│ ├── config/ # Configuration files
│ ├── db/ # Database connection and migrations
│ ├── graphql/ # GraphQL schema and resolvers
│ │ ├── schema/ # Schema definitions
│ │ ├── resolvers/ # Resolver functions
│ │ └── index.ts # Apollo Server setup
│ ├── middleware/ # Express middleware
│ │ ├── auth.ts # Authentication middleware
│ │ └── tenant.ts # Tenant isolation middleware
│ ├── models/ # Data models
│ ├── services/ # Business logic
│ ├── subscriptions/ # Real-time subscriptions
│ ├── utils/ # Utility functions
│ └── index.ts # Main server entry
├── migrations/ # Database migrations
└── package.json

Key Backend Components
Tenant Isolation Middleware:

Ensures data isolation between tenants

Adds tenant context to all requests

GraphQL Schema:

Type definitions for all entities

Queries and mutations for all operations

Subscriptions for real-time updates

Services Layer:

InventoryService: Handle stock movements

ProductService: Manage products and variants

DeviceService: Register and manage scanning devices

AuditService: Log all important actions

NotificationService: Handle real-time notifications

Real-Time Components:

WebSocket server for live updates

GraphQL subscriptions for inventory changes
