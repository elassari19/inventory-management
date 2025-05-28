# Testing Documentation

## Testing Strategy

The Ventory Dashboard uses a comprehensive testing approach with multiple levels of testing to ensure reliability, performance, and accessibility.

## Testing Stack

- **Unit Testing**: Jest + React Testing Library
- **Integration Testing**: React Testing Library + MSW (Mock Service Worker)
- **E2E Testing**: Cypress or Playwright
- **Accessibility Testing**: jest-axe + @testing-library/jest-dom
- **Performance Testing**: Lighthouse CI

## Setup

### Install Testing Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom vitest @vitest/ui jsdom
```

### Test Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
```

### Test Setup File

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
```

## Test Categories

### 1. Component Tests

Test individual components in isolation:

```typescript
// Example: Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: 'Click me' })
    ).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is accessible', async () => {
    const { container } = render(<Button>Accessible button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 2. Hook Tests

Test custom React hooks:

```typescript
// Example: useAuth.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('starts with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logs in successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('user@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### 3. Integration Tests

Test component interactions and data flow:

```typescript
// Example: UserManagement.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersPage } from '../pages/UsersPage';
import { MockedProvider } from '@apollo/client/testing';

const mocks = [
  {
    request: {
      query: GET_USERS,
    },
    result: {
      data: {
        users: [{ id: '1', name: 'John Doe', email: 'john@example.com' }],
      },
    },
  },
];

describe('UsersPage Integration', () => {
  it('displays users and allows creating new user', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <UsersPage />
      </MockedProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Test creating new user
    await userEvent.click(screen.getByRole('button', { name: /add user/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

### 4. API Tests

Test GraphQL operations:

```typescript
// Example: api.test.tsx
import { MockedProvider } from '@apollo/client/testing';
import { useGetUsers } from '../services/api';

describe('API Operations', () => {
  it('fetches users successfully', async () => {
    const mocks = [
      {
        request: { query: GET_USERS },
        result: { data: { users: [] } },
      },
    ];

    const { result } = renderHook(() => useGetUsers(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks}>{children}</MockedProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeDefined();
    });
  });
});
```

## Test Utilities

### Custom Render Function

```typescript
// src/test/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import { store } from '../store';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <MockedProvider mocks={[]}>{children}</MockedProvider>
      </BrowserRouter>
    </Provider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Mock Data Factories

```typescript
// src/test/factories.ts
export const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  status: 'active',
  createdAt: '2023-01-01T00:00:00Z',
  lastLogin: '2023-12-01T00:00:00Z',
  ...overrides,
});

export const createMockTenant = (overrides = {}) => ({
  id: '1',
  name: 'Acme Corp',
  slug: 'acme',
  status: 'active',
  plan: 'pro',
  users: 10,
  createdAt: '2023-01-01T00:00:00Z',
  ...overrides,
});
```

## Accessibility Testing

### Automated A11y Tests

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Keyboard Navigation Tests

```typescript
describe('Keyboard Navigation', () => {
  it('supports keyboard navigation', async () => {
    render(<Modal isOpen onClose={vi.fn()} />);

    // Test Tab navigation
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();

    // Test Escape key
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
```

## Performance Testing

### Component Performance

```typescript
import { Profiler } from 'react';

describe('Performance Tests', () => {
  it('renders efficiently', () => {
    let renderTime = 0;

    const onRender = (id: string, phase: string, actualDuration: number) => {
      renderTime = actualDuration;
    };

    render(
      <Profiler id="DataTable" onRender={onRender}>
        <DataTable data={largeDataset} columns={columns} />
      </Profiler>
    );

    expect(renderTime).toBeLessThan(100); // 100ms threshold
  });
});
```

## Test Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open"
  }
}
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## Best Practices

### 1. Test Naming

```typescript
// Good: Descriptive test names
it('should display error message when login fails with invalid credentials');

// Bad: Vague test names
it('should handle error');
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should update user when form is submitted', async () => {
  // Arrange
  const user = createMockUser();
  const onUpdate = vi.fn();

  // Act
  render(<UserForm user={user} onUpdate={onUpdate} />);
  await userEvent.type(screen.getByLabelText(/name/i), 'New Name');
  await userEvent.click(screen.getByRole('button', { name: /save/i }));

  // Assert
  expect(onUpdate).toHaveBeenCalledWith({
    ...user,
    name: 'New Name',
  });
});
```

### 3. Test User Behavior, Not Implementation

```typescript
// Good: Test user interactions
it('allows user to filter the user list', async () => {
  render(<UserList />);
  await userEvent.type(screen.getByRole('searchbox'), 'john');
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
});

// Bad: Test implementation details
it('calls setFilter when input changes', () => {
  // This tests implementation, not user behavior
});
```

### 4. Mock External Dependencies

```typescript
// Mock fetch calls
vi.mock('../services/api', () => ({
  useGetUsers: () => ({
    data: mockUsers,
    loading: false,
    error: null,
  }),
}));
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Happy path scenarios
- **Accessibility**: All interactive components

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test UserForm.test.tsx

# Run tests matching pattern
npm test --grep "authentication"
```
