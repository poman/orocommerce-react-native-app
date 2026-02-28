# OroCommerce React Native Mobile App

A React Native mobile application for OroCommerce B2B e-commerce platform(6.1LTS+), built with Expo.

[![Get it on Google Play](https://img.shields.io/badge/Google%20Play-Demo%20App-414141?style=for-the-badge&logo=google-play&logoColor=white)](https://play.google.com/store/apps/details?id=com.rkukla.orocommerceapp)
[![Watch Demo](https://img.shields.io/badge/YouTube-Watch%20Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=jvExANt-Q9E)

## Screenshots

<p style="text-align: center;">
  <img src="docs/doc-screenshots/home.png" width="200" alt="Home Screen" />
  <img src="docs/doc-screenshots/category.png" width="200" alt="Products Category" />
  <img src="docs/doc-screenshots/shopping-list.png" width="200" alt="Shopping List" />
  <img src="docs/doc-screenshots/order.png" width="200" alt="Order" />
</p>

## Table of Contents

- [Quick Start](#quick-start)
- [OroCommerce Configuration](#orocommerce-configuration)
- [App Configuration](#app-configuration)
- [Running the App](#running-the-app)
- [Testing](#testing)
- [Deployment](#deployment)
- [Theming](#theming)
- [Features](#features)
- [License](#license)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- OroCommerce instance (6.1 or higher)
- Expo account (for deployment)

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:poman/orocommerce-react-native-app.git
   cd orocommerce-react-native-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the app:**
   
   Copy the example configuration:
   ```bash
   cp app.json.example app.json
   ```
   
   Then update `app.json` with your settings (see [App Configuration](#app-configuration))

4. **Start the development server:**
   ```bash
   npx expo start -c
   ```

5. **Run on your device:**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (macOS only)
   - Press `w` for web browser
   
   By default, the web app will be available at **http://localhost:8081/**

## OroCommerce Configuration

### 1. Enable Guest Storefront API

In OroCommerce Admin Panel:

1. Navigate to **System → Configuration → Commerce → Guests → Website Access**
2. Enable **"Enable Guest Storefront API"**
3. Click **"Save Settings"**

### 2. Configure CORS Settings

Update your OroCommerce `config/config.yml`:

```yaml
oro_frontend:
  routes_to_expose: ['oro_.*']
  frontend_api:
    cors:
      preflight_max_age: 600
      allow_origins: ['*']  # Change to your domain in production
      allow_credentials: true
      allow_headers:
        - 'Content-Type'
        - 'Accept'
        - 'Authorization'
        - 'X-Addon'
        - 'X-CSRF-Header'
      expose_headers:
        - 'Content-Type'
        - 'X-Include'
        - 'X-CSRF-Header'

oro_oauth2_server:
  authorization_server:
    cors:
      allow_origins: ['*']  # Change to your domain in production
```

**Important:** For production, replace `'*'` with your specific domain(s).

After updating, clear the cache:

```bash
php bin/console cache:clear
```

### 3. Create OAuth Application

1. In OroCommerce Admin Panel, navigate to **System → Customers → Customer User OAuth Applications**
2. Click **"Create OAuth Application"**
3. Fill in:
   - **Name:** Your app name (e.g., "Mobile App")
   - **Grant Type:** Select **"password"**
   - **Active:** Check the box
4. Click **"Save"**
5. **Copy the generated Client ID and Client Secret** - you'll need these for app.json

## App Configuration

### Local Setup

Copy the example and fill in your real values:

```bash
cp app.json.example app.json
```

Update `app.json` with your OroCommerce URL, OAuth credentials, and EAS Project ID:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      },
      "EXPO_PUBLIC_API_BASE_URL": "https://your-orocommerce.com/",
      "EXPO_PUBLIC_OAUTH_CLIENT_ID": "your_client_id_from_step_3",
      "EXPO_PUBLIC_OAUTH_CLIENT_SECRET": "your_client_secret_from_step_3"
    }
  }
}
```

> `app.json` is gitignored — your credentials stay local. For EAS CI builds, credentials are injected via **EAS Secrets** (see [Deployment Guide](./docs/DEPLOYMENT.md)).

If you haven't set up EAS yet, run `eas build:configure` to generate a Project ID.

## Running the App

### Development Mode

```bash
# Start with cache clear
npx expo start -c

# Run on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

When you start the development server:
- The Expo DevTools will open in your browser
- For web development, the app runs at **http://localhost:8081/** by default
- Scan the QR code with Expo Go app to run on physical devices
- Use platform shortcuts (`a`, `i`, `w`) for emulators/simulators

### Demo Mode vs Production Mode

The app supports two modes configured in `src/themes/config.ts`:

**Demo Mode (default):**
- Shows test login button with demo credentials
- Settings page visible in Profile
- Configuration wizard appears on errors
- Perfect for testing and development

**Production Mode:**
- Test login hidden
- Settings page hidden
- Configuration wizard hidden
- Perfect for released app with fixed OroCommerce instance

To switch modes, edit `src/themes/config.ts`:

```typescript
export const AppConfig = {
  mode: 'production', // Change to 'production' for release
  // ...
};
```

## Testing

The app includes comprehensive test coverage:

### Unit Tests

Test individual functions and utilities:

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

### Integration Tests

Test service interactions and API calls:

```bash
npm test tests/integration  # Run integration tests
```

### End-to-End Tests

Test complete user workflows with Playwright:

```bash
# First time: Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e            # Headless mode
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # See browser
npm run test:e2e:report     # View test report
```

### Run All Tests

```bash
npm run test:all            # Run all test types
```

## Deployment

For detailed deployment instructions see **[Deployment Guide](./docs/DEPLOYMENT.md)**

## Theming

The app ships with four built-in themes and a flexible theming system. You can customize colors, logos, toasts, banners, and more — or create your own theme from scratch.

See the **[Theming Guide](./docs/THEMING_GUIDE.md)** for full details.

## Features

### Shopping & Products
- Browse OroCommerce product catalog
- View product details with images, SKU, price, and inventory
- Manage shopping lists
- Add products to cart
- Wishlist functionality
- Recently viewed products

### Authentication
- Guest browsing (no login required)
- OAuth 2.0 user authentication
- Automatic token refresh
- Secure session management

### Checkout
- Multi-step checkout process
- Address management
- Shipping method selection
- Payment method selection
- Order confirmation

### User Features
- Order history
- Profile management
- My Conversations (support tickets)
- Settings (in demo mode)

### UI/UX
- Responsive design (360px - 1200px)
- Tab navigation
- Pull-to-refresh
- Skeleton loading states

## License

MIT License - See [LICENSE](./LICENSE) for details.

