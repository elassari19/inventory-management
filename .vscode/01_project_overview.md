# Ventory - Multi-tenant Inventory Management SaaS

## Project Overview

Ventory is a multi-tenant inventory management SaaS with mobile app and admin dashboard capabilities. The platform supports various inventory types including e-commerce, restaurants, and libraries with customization options for each tenant.

## Technology Stack

- **Mobile App**: Expo CLI, React Native, Redux Toolkit, Expo Camera, Expo Router
- **Backend**: Express.js, PostgreSQL, Passport.js
- **Additional Services**: Redis for caching, DynamoDB for high-speed metadata

## Architecture Overview

- Multi-tenant architecture with shared services but isolated business data
- Hybrid database approach: PostgreSQL for relational data + DynamoDB for settings/metadata
- REST for internal services, GraphQL for external APIs
- Horizontal scaling with tenant-aware resource management

## Repository Structure

- `/client` - Expo-based mobile application
- `/server` - Express.js backend services
- `/web` - Admin dashboard web application
- `/shared` - Shared utilities and types
- `/infrastructure` - Deployment and infrastructure configuration
