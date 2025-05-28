# Ventory Dashboard - Multi-Tenant Inventory Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A modern, comprehensive web admin dashboard for the Ventory multi-tenant inventory management system. Built with React 18, TypeScript, and a powerful suite of modern tools for scalable enterprise administration.

## 🚀 Features

### 🏢 Multi-Tenant Administration

- **Tenant Management**: Create, configure, and manage multiple tenants
- **Resource Allocation**: Monitor and control tenant-specific resources
- **Custom Branding**: Tenant-specific customization and theming
- **Usage Analytics**: Track tenant activity and resource consumption

### 👥 User Management

- **Role-Based Access Control**: Granular permissions and role management
- **User Authentication**: Secure login with session management
- **Activity Tracking**: Monitor user actions and login history
- **Bulk Operations**: Efficient management of multiple users

### 📦 Advanced Inventory Management

- **Real-time Stock Tracking**: Live inventory updates via WebSocket
- **Multi-location Support**: Manage inventory across multiple warehouses
- **Low Stock Alerts**: Automated notifications for reorder points
- **Bulk Import/Export**: CSV, JSON, XLSX data operations
- **Audit Trail**: Complete history of inventory movements

### 📊 Analytics & Reporting

- **Interactive Dashboards**: Chart.js powered visualizations
- **Custom Reports**: Generate tailored reports with filtering
- **Real-time Metrics**: Live KPIs and performance indicators
- **Export Capabilities**: Multiple format exports (CSV, JSON, PDF)

### ⚙️ System Configuration

- **Application Settings**: System-wide configuration management
- **Integration Management**: Third-party service integrations
- **Health Monitoring**: System status and performance tracking
- **Security Controls**: Advanced security settings and policies

### 🔍 Comprehensive Audit Logging

- **Activity Logs**: Complete audit trail of all system actions
- **Security Events**: Monitor authentication and authorization events
- **Data Changes**: Track all data modifications with timestamps
- **Compliance Reports**: Generate compliance and security reports

## 🛠️ Tech Stack

### Frontend Framework

- **React 18**: Latest React with concurrent features
- **TypeScript**: Strict typing for better development experience
- **Vite**: Lightning-fast build tool and development server

### UI & Styling

- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible component library
- **Lucide React**: Beautiful, customizable icons
- **CSS Modules**: Scoped styling with component isolation

### State Management

- **Redux Toolkit**: Modern Redux with simplified API
- **RTK Query**: Powerful data fetching and caching
- **React Router v6**: Declarative routing with modern patterns

### Data & API

- **Apollo Client**: Comprehensive GraphQL client
- **GraphQL**: Type-safe API queries and mutations
- **WebSocket**: Real-time updates and notifications

### Charts & Visualization

- **Chart.js**: Flexible and powerful charting library
- **react-chartjs-2**: React wrapper for Chart.js

## 📁 Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── ui/                 # Basic UI components (Button, Input, etc.)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── DataTable.tsx   # Advanced data table with sorting/pagination
│   │   ├── Modal.tsx       # Accessible modal component
│   │   ├── Toast.tsx       # Notification system
│   │   ├── Charts.tsx      # Chart components
│   │   ├── Loading.tsx     # Loading states
│   │   ├── Skeleton.tsx    # Loading skeletons
│   │   └── ErrorBoundary.tsx # Error handling
│   └── layout/             # Layout components
│       ├── DashboardLayout.tsx
│       ├── Header.tsx
│       └── Sidebar.tsx
├── pages/                  # Page components
│   ├── DashboardPage.tsx   # Main dashboard with metrics
│   ├── TenantsPage.tsx     # Tenant management
│   ├── UsersPage.tsx       # User management with advanced table
│   ├── InventoryPage.tsx   # Inventory management
│   ├── ReportsPage.tsx     # Analytics and reporting
│   ├── SettingsPage.tsx    # System configuration
│   ├── AuditLogsPage.tsx   # Audit trail
│   └── LoginPage.tsx       # Authentication
├── hooks/                  # Custom React hooks
│   ├── redux.ts           # Redux hooks
│   └── useWebSocket.ts     # Real-time WebSocket hooks
├── store/                  # Redux store configuration
│   ├── index.ts           # Store setup
│   └── slices/            # Redux slices
│       ├── authSlice.ts
│       ├── tenantSlice.ts
│       └── uiSlice.ts
├── services/              # API and external services
│   ├── api.ts            # GraphQL API service
│   └── graphql/          # GraphQL queries and mutations
│       └── queries.ts
├── lib/                   # Utility libraries
│   ├── utils.ts          # General utilities
│   ├── apollo.ts         # Apollo Client configuration
│   └── export.ts         # Data export utilities
└── types/                # TypeScript type definitions
    └── index.ts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Git**: For version control

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ventory/dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:

   ```env
   VITE_API_URL=https://api.ventory.com
   VITE_GRAPHQL_ENDPOINT=https://api.ventory.com/graphql
   VITE_WS_URL=ws://localhost:8080/ws
   VITE_WS_METRICS_URL=ws://localhost:8080/metrics
   VITE_WS_INVENTORY_URL=ws://localhost:8080/inventory
   VITE_APP_ENV=development
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npm run type-check
```

### VS Code Integration

The project includes VS Code tasks for streamlined development:

- **Dev Server**: Use `Ctrl+Shift+P` → "Tasks: Run Task" → "Dev Server"
- **Build**: Use `Ctrl+Shift+P` → "Tasks: Run Task" → "Build"

## 🎨 Design System

### Color Palette

The application uses CSS custom properties for theming:

- **Primary**: Brand colors for main actions
- **Secondary**: Supporting interface elements
- **Accent**: Highlights and call-to-action items
- **Neutral**: Text and background variations
- **Semantic**: Success, warning, error, and info states

### Typography

- **Font Stack**: System font stack for optimal performance
- **Scale**: Consistent typography scale (12px - 48px)
- **Weight**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Spacing

- **Grid System**: 8px base grid for consistent spacing
- **Breakpoints**: Mobile-first responsive design
- **Layout**: Flexible grid and container systems

## 🔧 Configuration

### Environment Variables

| Variable                | Description                         | Default                         |
| ----------------------- | ----------------------------------- | ------------------------------- |
| `VITE_API_URL`          | Backend API base URL                | `http://localhost:3000`         |
| `VITE_GRAPHQL_ENDPOINT` | GraphQL endpoint                    | `/graphql`                      |
| `VITE_WS_URL`           | WebSocket URL for real-time updates | `ws://localhost:8080/ws`        |
| `VITE_WS_METRICS_URL`   | WebSocket URL for metrics           | `ws://localhost:8080/metrics`   |
| `VITE_WS_INVENTORY_URL` | WebSocket URL for inventory         | `ws://localhost:8080/inventory` |
| `VITE_APP_ENV`          | Application environment             | `development`                   |

### Apollo Client Configuration

The GraphQL client is configured in `src/lib/apollo.ts` with:

- **Caching**: Intelligent query caching for performance
- **Error Handling**: Global error handling with user notifications
- **Authentication**: Automatic token management
- **Real-time**: WebSocket subscriptions for live updates

## 📊 Key Components

### DataTable Component

Advanced data table with:

- **Sorting**: Multi-column sorting with indicators
- **Pagination**: Configurable page sizes and navigation
- **Filtering**: Search and column-specific filters
- **Selection**: Row selection with bulk operations
- **Export**: Built-in data export functionality

### Modal System

Accessible modal component featuring:

- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus trapping
- **Multiple Sizes**: Small, medium, large, and full-screen
- **Animation**: Smooth enter/exit transitions

### Toast Notifications

Comprehensive notification system:

- **Types**: Success, error, warning, and info variants
- **Positioning**: Configurable positioning
- **Auto-dismiss**: Configurable timeout
- **Actions**: Interactive notification actions

### Real-time Updates

WebSocket integration for:

- **Live Metrics**: Real-time dashboard updates
- **Inventory Changes**: Stock level notifications
- **User Activity**: Live user action tracking
- **System Events**: Real-time system notifications

## 🔐 Security Features

### Authentication

- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Automatic token refresh
- **Role-based Access**: Granular permission system
- **Activity Logging**: Complete audit trail

### Data Protection

- **Input Validation**: Client and server-side validation
- **XSS Prevention**: Sanitized data rendering
- **CSRF Protection**: Cross-site request forgery prevention
- **Secure Headers**: Security-focused HTTP headers

## 🧪 Testing Strategy

### Unit Testing

- **Components**: React Testing Library for component tests
- **Utilities**: Jest for utility function testing
- **Hooks**: Testing custom React hooks
- **Stores**: Redux store and slice testing

### Integration Testing

- **API Integration**: GraphQL query and mutation testing
- **User Flows**: End-to-end user interaction testing
- **Component Integration**: Multi-component interaction testing

### Performance Testing

- **Bundle Analysis**: Webpack bundle analyzer integration
- **Lighthouse**: Performance metrics monitoring
- **Memory Leaks**: Memory usage monitoring

## 📈 Performance Optimization

### Bundle Optimization

- **Code Splitting**: Route-based code splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and asset compression
- **Caching**: Intelligent browser caching strategies

### Runtime Performance

- **React.memo**: Preventing unnecessary re-renders
- **useMemo/useCallback**: Expensive calculation memoization
- **Virtual Scrolling**: Large list optimization
- **Lazy Loading**: Component and route lazy loading

## 🚀 Deployment

### Production Build

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Environment Setup

1. **Production Environment Variables**
2. **CDN Configuration** for static assets
3. **Server Configuration** for SPA routing
4. **Security Headers** configuration

### CI/CD Pipeline

- **Automated Testing**: Run tests on every push
- **Build Verification**: Ensure successful production builds
- **Deployment**: Automated deployment to staging/production
- **Monitoring**: Post-deployment health checks

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow the established TypeScript and React patterns
2. **Component Structure**: Maintain consistent component organization
3. **Testing**: Write tests for new features and bug fixes
4. **Documentation**: Update documentation for new features

### Pull Request Process

1. **Branch Naming**: Use descriptive branch names
2. **Commit Messages**: Follow conventional commit format
3. **Code Review**: All changes require code review
4. **Testing**: Ensure all tests pass before merging

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- **API Documentation**: [API Docs](docs/api.md)
- **Component Documentation**: [Component Docs](docs/components.md)
- **Deployment Guide**: [Deployment Docs](docs/deployment.md)

### Getting Help

- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: support@ventory.com for enterprise support

## 🗺️ Roadmap

### Phase 5 - Advanced Features

- [ ] Advanced Analytics Dashboard
- [ ] Multi-language Support (i18n)
- [ ] Advanced Search and Filtering
- [ ] Mobile Application
- [ ] API Rate Limiting and Quotas

### Phase 6 - Enterprise Features

- [ ] Single Sign-On (SSO) Integration
- [ ] Advanced Reporting Engine
- [ ] Custom Workflow Builder
- [ ] Advanced Security Features
- [ ] Performance Monitoring Dashboard

---

**Ventory Dashboard** - Empowering businesses with intelligent inventory management.
