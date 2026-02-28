# Theming Guide

How themes work, how to switch them, and how to create your own.

---

## Overview

Every visual property — colors, toasts, branding, banners, HTML styles — is bundled into a single `Theme` object. The active theme is provided via React Context and persisted in AsyncStorage.

```
src/themes/
├── types.ts                 # Theme interface definitions
├── index.ts                 # Theme registry & helpers
├── golden-carbon/           # Default theme (PNG logo, no text)
│   ├── index.ts
│   └── Logo.tsx
├── refreshing-teals/        # Teal theme (SVG logo + store name)
│   ├── index.ts
│   └── Logo.tsx
├── royal-indigo/            # Indigo theme (SVG logo + store name)
│   ├── index.ts
│   └── Logo.tsx
└── sunset-ember/            # Ember theme (SVG logo + store name)
    ├── index.ts
    └── Logo.tsx
```

Four built-in themes are included: **Golden Carbon** (default), **Refreshing Teals**, **Royal Indigo**, and **Sunset Ember**.

---

## Using the Theme in Components

### Basic Usage

```tsx
import { useTheme } from '@/src/context/ThemeContext';

const { colors } = useTheme();

<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>Hello!</Text>
</View>
```

### With StyleSheet (recommended)

```tsx
const { colors } = useTheme();
const styles = useMemo(() => createStyles(colors), [colors]);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    title: { fontSize: 20, fontWeight: '700', color: colors.text },
  });
```

### Switching Themes

```tsx
const { setThemeById, availableThemes } = useTheme();
await setThemeById('refreshing-teals');
```

---

## Creating a Custom Theme

### 1. Create the theme folder

```bash
mkdir src/themes/my-brand
```

### 2. Create `Logo.tsx`

Each theme has its own `Logo.tsx`. There are two approaches:

**SVG logo + store name** — uses the shared `BrandLogo` component (32×32 diamond icon + text):

```tsx
// src/themes/my-brand/Logo.tsx
import React from 'react';
import { BrandLogo } from '@/src/components/OroLogo';

const MyBrandLogo: React.FC<{ width: number; height: number; color?: string }> = ({
  width,
  height,
}) => (
  <BrandLogo
    width={width}
    height={height}
    color="#FF6B00"          // icon color
    textColor="#FF6B00"      // text color (defaults to icon color if omitted)
    name="My Store"          // short store name rendered as SVG text
  />
);

export default MyBrandLogo;
```

**PNG image only** (no text) — like the Golden Carbon theme:

```tsx
// src/themes/my-brand/Logo.tsx
import React from 'react';
import { Image } from 'expo-image';

const MyBrandLogo: React.FC<{ width: number; height: number; color?: string }> = ({
  width,
  height,
}) => (
  <Image
    source={require('@/assets/images/my_logo.png')}
    style={{ width, height }}
    contentFit="contain"
  />
);

export default MyBrandLogo;
```

### 3. Create `index.ts`

Copy an existing theme and modify the values:

```typescript
// src/themes/my-brand/index.ts
import { Theme } from '../types';
import MyBrandLogo from './Logo';

const colors = {
  primary: '#FF6B00',
  secondary: '#1E88E5',
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',
  sale: '#D32F2F',
  tabIconDefault: '#BDBDBD',
  tabIconSelected: '#FF6B00',
  shadow: '#000000',
} as const;

const MyBrandTheme: Theme = {
  meta: {
    id: 'my-brand',
    name: 'My Brand',
    description: 'Bold orange brand theme.',
    version: '1.0.0',
  },
  colors,
  toastColors: { /* ... see existing themes for examples */ },
  shopConfig: {
    LogoComponent: MyBrandLogo,
    logoWidth: 160,
    logoHeight: 32,
    storeName: 'My Brand Store',
  },
  htmlStyles: { /* ... */ },
  homepageBanners: [ /* ... */ ],
  homepageSectionBanners: [ /* ... */ ],

  // Optional: override app config values for this theme
  configOverrides: {
    recentlyViewed: { maxProducts: 6 },
    price: { precision: 3 },
  },
};

export default MyBrandTheme;
```

### 4. Register the theme

Open `src/themes/index.ts` and add your theme:

```typescript
import MyBrandTheme from './my-brand';

export const themes: Record<string, Theme> = {
  'golden-carbon': GoldenCarbonTheme,
  'refreshing-teals': RefreshingTealsTheme,
  'royal-indigo': RoyalIndigoTheme,
  'sunset-ember': SunsetEmberTheme,
  'my-brand': MyBrandTheme,           // ← add here
};
```

### 5. (Optional) Set as default

```typescript
// src/themes/index.ts
export const DEFAULT_THEME_ID = 'my-brand';
```

---

## Config Overrides Example

Themes can override any `AppConfig` value. The `ThemeContext` merges these with the base config and exposes the result as `effectiveConfig`:

```typescript
// In your theme definition
configOverrides: {
  mode: 'demo',
  demo: { url: 'https://my-store.example.com' },
  price: { precision: 3 },
  shoppingList: { defaultPageSize: 10 },
  recentlyViewed: { maxProducts: 6, listingRecentlyViewed: 5 },
  featuredProducts: { maxProducts: 12, listingFeaturedProducts: 8 },
  newArrival: { maxProducts: 8, listingNewArrival: 4 },
},
```

```tsx
// In a component
const { effectiveConfig } = useTheme();
console.log(effectiveConfig.price.precision); // 3 (overridden by theme)
```

---

## Theme API Quick Reference

### ThemeColors

| Token | Used In |
|---|---|
| `primary` | Buttons, active tabs, links, badges, header search icon |
| `secondary` | Secondary buttons, highlights |
| `background` | Screen backgrounds |
| `cardBackground` | Product cards, modals |
| `text` | Headings, body text |
| `textSecondary` | Subtitles, descriptions |
| `border` | Card borders, separators |
| `error` | Error messages, delete buttons |
| `success` | Success badges |
| `warning` | Warning badges |
| `sale` | Sale price labels |
| `tabIconDefault` / `tabIconSelected` | Bottom tab bar icons |

### ThemeShopConfig

| Property | Type | Description |
|---|---|---|
| `LogoComponent` | `React.ComponentType` | SVG/PNG logo component (takes priority over `logo`) |
| `logo` | `ImageSourcePropType` | Fallback PNG/JPG image source |
| `logoWidth` | `number` | Logo display width |
| `logoHeight` | `number` | Logo display height |
| `storeName` | `string` | Store name for branding |

### Banner Types

| Type | Description |
|---|---|
| `feature` | Icon + text row |
| `image` | Full-width image with overlay text |
| `promo-bar` | Compact promotional bar |

Positions: `before-recently-viewed`, `after-recently-viewed`, `after-featured`, `after-new-arrival`, `after-all`

---

## Demo vs Production

- **Demo mode** (`AppConfig.mode = 'demo'`): Theme picker appears in **Profile → Settings**.
- **Production mode**: Theme is controlled by `DEFAULT_THEME_ID` in `src/themes/index.ts`. No picker shown.

To show the picker in production, remove the `isDemoMode()` guard in `app/profile/settings.tsx`.

---

## FAQ

**How do I preview a theme?** Set `AppConfig.mode` to `'demo'`, then use **Profile → Settings → Theme Appearance**.

**What if a theme ID doesn't exist?** `getTheme()` falls back to the default theme.

**How does persistence work?** The theme ID is stored in AsyncStorage. On launch, the stored theme is applied. If none is stored, `DEFAULT_THEME_ID` is used.

**Can I add new color tokens?** Extend `ThemeColors` in `src/themes/types.ts` — TypeScript will flag any theme missing the new token.

**Dark mode?** Create a dark-mode theme with dark backgrounds and light text, then switch to it programmatically.
