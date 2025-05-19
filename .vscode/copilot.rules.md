You are an expert in TypeScript, Node.js, Express.js, Next.js, React Native, Expo, and Mobile UI development.

## Code Style and Structure

- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Structure files: exported component, subcomponents, helpers, static content, types.
- Follow Expo's official documentation for setting up and configuring your projects: https://docs.expo.dev/
- Follow Next.js official documentation for setting up and configuring your projects: https://nextjs.org/docs
- Follow Express.js official documentation for setting up and configuring your projects: https://devdocs.io/express/
- Implement proper file organization:
  - Group related files in feature-based directories
  - Separate business logic from UI components
  - Use barrel files (index.ts) to simplify imports

## Naming Conventions

- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.
- Use PascalCase for component names and interfaces (e.g., AuthButton, UserProfile).
- Use camelCase for variables, functions, and instances.
- Use ALL_CAPS for constants.
- Prefix interfaces with 'I' (e.g., IUserProps) for clarity.
- Use meaningful, descriptive names that explain the purpose.

## TypeScript Usage

- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use const objects with as const assertion instead.
- Use functional components with TypeScript interfaces.
- Use strict mode in TypeScript for better type safety.
- Leverage utility types (Partial, Omit, Pick, etc.) to create derivative types.
- Use generics for reusable components and functions.
- Properly type API responses and state structures.
- Add explicit return types to functions unless obvious from context.
- Use union and intersection types for flexible interfaces.

## Syntax and Formatting

- Use the "function" keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.
- Use Prettier for consistent code formatting.
- Prefer async/await over promise chains.
- Use optional chaining (?.) and nullish coalescing (??) operators.
- Use template literals for string interpolation.
- Leverage destructuring for cleaner code.
- Use spread/rest operators appropriately.

## UI and Styling

- Reusable components first (DRY)
- Use Expo's built-in components for common UI patterns and layouts.
- Implement responsive design with Flexbox and Expo's useWindowDimensions for screen size adjustments.
- Use styled-components or Tailwind CSS for component styling.
- Implement dark mode support using Expo's useColorScheme.
- Ensure high accessibility (a11y) standards using ARIA roles and native accessibility props.
- Leverage react-native-reanimated and react-native-gesture-handler for performant animations and gestures.
- Use design tokens for consistent spacing, colors, and typography.
- Implement component variants through props rather than creating multiple similar components.
- Use fluid typography and spacing (responsive font sizes and margins).
- Implement skeleton screens for better loading UX.

## Safe Area Management

- Use SafeAreaProvider from react-native-safe-area-context to manage safe areas globally in your app.
- Wrap top-level components with SafeAreaView to handle notches, status bars, and other screen insets on both iOS and Android.
- Use SafeAreaScrollView for scrollable content to ensure it respects safe area boundaries.
- Avoid hardcoding padding or margins for safe areas; rely on SafeAreaView and context hooks.
- Use useSafeAreaInsets() for precise control over individual insets when needed.
- Test on various device dimensions and notch configurations.

## Performance Optimization

- Minimize the use of useState and useEffect; prefer context and reducers for state management.
- Use Expo's AppLoading and SplashScreen for optimized app startup experience.
- Optimize images: use WebP format where supported, include size data, implement lazy loading with expo-image.
- Implement code splitting and lazy loading for non-critical components with React's Suspense and dynamic imports.
- Profile and monitor performance using React Native's built-in tools and Expo's debugging features.
- Avoid unnecessary re-renders by memoizing components and using useMemo and useCallback hooks appropriately.
- Virtualize long lists with FlatList or SectionList.
- Implement pagination for large data sets.
- Use compressed assets and optimized fonts.
- Implement proper caching strategies for API responses.
- Monitor bundle size and optimize imports.
- Use memo() for pure components that render often but rarely change.

## Navigation

- Use react-navigation for routing and navigation; follow its best practices for stack, tab, and drawer navigators.
- Leverage deep linking and universal links for better user engagement and navigation flow.
- Use dynamic routes with expo-router for better navigation handling.
- Implement proper navigation state persistence.
- Use navigation params thoughtfully, avoid passing large objects.
- Implement proper navigation types for type safety.
- Use navigation events to trigger side effects when needed.
- Implement proper navigation transitions and animations.
- Handle back button behavior appropriately.

## State Management

- Use Redux Toolkit for managing global state.
- Handle URL search parameters using libraries like expo-linking.
- Implement optimistic updates for better UX.
- Use proper state normalization techniques for relational data.
- Separate UI state from domain state.
- Use hooks for encapsulating complex state logic.
- Implement proper state persistence strategies.
- Use state machines for complex flows with many possible states.

## Error Handling and Validation

- Use Zod for runtime validation and error handling.
- Implement proper error logging using Sentry or a similar service.
- Prioritize error handling and edge cases:
  - Handle errors at the beginning of functions.
  - Use early returns for error conditions to avoid deeply nested if statements.
  - Avoid unnecessary else statements; use if-return pattern instead.
  - Implement global error boundaries to catch and handle unexpected errors.
- Use expo-error-reporter for logging and reporting errors in production.
- Create user-friendly error messages.
- Implement retry mechanisms for network requests.
- Add fallback UI components for error states.
- Validate form inputs as users type for immediate feedback.
- Implement proper API error handling with status codes.
- Use try/catch blocks consistently.
- Categorize errors (network, validation, authorization, etc.).

## Security

- Sanitize user inputs to prevent XSS attacks.
- Use react-native-encrypted-storage for secure storage of sensitive data.
- Ensure secure communication with APIs using HTTPS and proper authentication.
- Use Expo's Security guidelines to protect your app: https://docs.expo.dev/guides/security/
- Implement proper token management and refresh mechanisms.
- Use environment variables for sensitive configuration.
- Implement certificate pinning for critical API endpoints.
- Regular security audits of dependencies.
- Implement proper authentication flows with biometrics where appropriate.
- Use secure random number generation.
- Implement rate limiting for sensitive operations.
- Handle session timeouts properly.

## Internationalization (i18n) and Accessibility

- Use react-native-i18n or expo-localization for internationalization and localization.
- Support multiple languages and RTL layouts.
- Ensure text scaling and font adjustments for accessibility.
- Implement proper accessibility labels and hints.
- Support dynamic type sizes for better readability.
- Test with screen readers and other assistive technologies.
- Implement proper keyboard navigation.
- Use sufficient color contrast for better readability.
- Provide alternative text for images and icons.
- Support system-wide accessibility settings.
- Design with accessibility in mind from the beginning.

## Mobile-specific Optimizations

- Handle offline scenarios gracefully with proper caching.
- Implement push notifications using expo-notifications.
- Use proper keyboard handling for form inputs.
- Support deep linking for better app integration.
- Optimize for different screen sizes and orientations.
- Handle device permissions gracefully.
- Implement proper loading states and indicators.
- Use platform-specific APIs when needed.
- Integrate with device features (camera, location, etc.) appropriately.
- Handle system events (app going to background, etc.).

## Key Conventions

1. Rely on Expo's managed workflow for streamlined development and deployment.
2. Prioritize Mobile Web Vitals (Load Time, Jank, and Responsiveness).
3. Use expo-constants for managing environment variables and configuration.
4. Use expo-permissions to handle device permissions gracefully.
5. Implement expo-updates for over-the-air (OTA) updates.
6. Follow Expo's best practices for app deployment and publishing: https://docs.expo.dev/distribution/introduction/
7. Ensure compatibility with iOS and Android by testing extensively on both platforms.
8. Use proper versioning for your app with semantic versioning.
9. Implement proper analytics to understand user behavior.
10. Document code extensively with JSDoc comments.

## Project Setup and Configuration

- Use proper dependency management with yarn or npm.
- Implement proper ESLint and Prettier configuration.
- Use TypeScript's strict mode configuration.
- Configure proper build scripts and environments.
- Implement proper CI/CD pipelines.
- Use proper version control with Git.
- Implement proper code review processes.
- Use monorepos for complex projects with shared code.
- Set up proper development, staging, and production environments.
- Configure proper bundling and optimization for production.

## Documentation

- Document component APIs with PropTypes or TypeScript interfaces.
- Create a comprehensive README for project setup and contribution.
- Document architectural decisions and patterns.
- Include code examples for common use cases.
- Document state management and data flow.
- Maintain a changelog for version tracking.
- Document UI design patterns and components.
- Use consistent documentation format across the project.

## API Documentation

- Use Expo's official documentation for setting up and configuring your projects: https://docs.expo.dev/
- Document all API endpoints with request/response formats.
- Include authentication requirements and error responses.
- Document rate limits and pagination mechanisms.
- Include example requests and responses.

Refer to Expo's documentation for detailed information on Views, Blueprints, and Extensions for best practices.
