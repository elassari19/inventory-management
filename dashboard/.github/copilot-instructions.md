# Ventory Dashboard - GitHub Copilot Instructions

## Project Overview

This is the Web Admin Dashboard (Phase 4) for the Ventory multi-tenant inventory management system. It's a React TypeScript application with modern tooling and comprehensive admin capabilities.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **GraphQL**: Apollo Client
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Lucide React
- **Styling**: CSS Modules + Tailwind CSS

## Code Style & Conventions

### TypeScript

- Use strict TypeScript with proper typing
- Prefer interfaces over types for object shapes
- Use enums for constants
- Always define proper return types for functions

### React Components

- Use functional components with hooks
- Prefer named exports over default exports
- Use proper prop typing with interfaces
- Follow the component structure: imports → types → component → export

### File Naming

- Components: PascalCase (e.g., `UserManagement.tsx`)
- Hooks: camelCase starting with 'use' (e.g., `useAuth.ts`)
- Utils: camelCase (e.g., `formatDate.ts`)
- Types: PascalCase (e.g., `User.ts`)

### Folder Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components (Button, Input, etc.)
│   └── layout/       # Layout components (Header, Sidebar, etc.)
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── store/            # Redux store, slices, and selectors
├── services/         # API services and GraphQL operations
├── types/            # TypeScript type definitions
└── lib/              # Utility functions and configurations
```

## Key Features to Implement

### 1. Multi-Tenant Administration

- Tenant creation, management, and configuration
- Tenant-specific settings and customization
- Resource allocation and usage monitoring

### 2. User Management

- User roles and permissions
- Authentication and authorization
- User activity tracking

### 3. Inventory Management

- Advanced inventory operations
- Bulk operations and data import/export
- Inventory analytics and reporting

### 4. Reporting & Analytics

- Interactive dashboards with Chart.js
- Real-time metrics and KPIs
- Customizable report generation

### 5. System Configuration

- Application settings and configuration
- Integration management
- System health monitoring

### 6. Audit Logging

- Comprehensive audit trails
- Activity logging and monitoring
- Security event tracking

## Component Guidelines

### UI Components (shadcn/ui)

- Use the cn() utility for className merging
- Follow shadcn/ui patterns for consistency
- Implement proper dark/light mode support
- Use CSS variables for theming

### State Management

- Use Redux Toolkit for global state
- Create specific slices for different domains
- Use RTK Query for data fetching when appropriate
- Keep local state for component-specific data

### GraphQL Integration

- Use Apollo Client for GraphQL operations
- Implement proper error handling
- Use fragments for reusable query parts
- Optimize queries with proper caching

## Development Best Practices

### Performance

- Use React.memo for expensive components
- Implement proper code splitting
- Optimize bundle size with tree shaking
- Use lazy loading for routes

### Accessibility

- Follow WCAG guidelines
- Use semantic HTML elements
- Implement proper ARIA labels
- Ensure keyboard navigation

### Security

- Validate all user inputs
- Implement proper authentication checks
- Use environment variables for sensitive data
- Follow OWASP security guidelines

### Testing

- Write unit tests for utility functions
- Use React Testing Library for component tests
- Mock external dependencies
- Maintain good test coverage

## Design System

### Colors

- Use CSS variables defined in index.css
- Follow the established color palette
- Ensure proper contrast ratios
- Support both light and dark themes

### Typography

- Use consistent font sizes and weights
- Follow the typography scale
- Ensure readability across devices

### Spacing

- Use Tailwind spacing utilities
- Maintain consistent spacing patterns
- Follow the 8px grid system

## Development Workflow

1. Create feature branches for new functionality
2. Write components with proper TypeScript typing
3. Implement tests for critical functionality
4. Follow the established code style
5. Use meaningful commit messages
6. Review code before merging

## Environment Setup

### Required Environment Variables

```env
VITE_API_URL=https://api.ventory.com
VITE_GRAPHQL_ENDPOINT=https://api.ventory.com/graphql
VITE_APP_ENV=development
```

### Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## Notes for AI Assistance

When working on this project:

1. Always consider multi-tenancy in your implementations
2. Ensure proper error handling and loading states
3. Follow the established patterns and conventions
4. Consider performance implications of your code
5. Implement proper accessibility features
6. Use the existing utility functions and components
7. Maintain consistency with the design system
8. Consider real-time updates where appropriate
9. Implement proper data validation
10. Follow security best practices
