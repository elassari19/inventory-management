# Mobile App User Interface

## Overview

Mobile application UI components and screens for inventory management on the go.

## Features

- Splash screen
- Onboarding flow
- Authentication screens
- Home dashboard
- Inventory management
- Scanning interface
- Order processing
- Settings and configuration

## Technical Implementation

- Expo SDK with Expo Router for navigation
- Redux Toolkit for state management
- Expo Camera for barcode/QR scanning
- Responsive layouts for various device sizes
- Offline capability with sync

## Key Screens

### Splash Screen

- App logo and branding
- Loading indicator
- Version information

### Onboarding Screens

- Language selection (auto-detected by default)
- Account creation
  - First and last name
  - Address
  - Phone
  - Email
- Inventory type selection
- Inventory setup
  - Logo/icon upload
  - Name
  - Tax ID
  - Custom fields
- Theme customization (colors)

### Home Screen

- Inventory type cards with icons
- Quick action buttons
- Recent activity
- Notifications
- Quick stats

### Inventory Screen

- Tab navigation for inventory sections (store, workers, suppliers, clients)
- List/grid view of inventory items
- Search and filter functionality
- Add/edit buttons
- Scan capability for quick inventory lookup
- Settings access

### Item Detail Screen

- Item information with images
- Stock levels across locations
- Transaction history
- Edit capabilities
- Related items

### Scanning Interface

- Camera view with scan frame
- Manual entry option
- Recently scanned items
- Quantity adjustment
- Action selection (add to inventory, add to order, etc.)

### Analytics Dashboard

- Key metrics visualization
- Inventory health indicators
- Sales and order trends
- Custom reports access

### Settings

- User profile management
- Inventory configuration
- Appearance settings
- Notification preferences
- Integration settings
