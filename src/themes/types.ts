import React from 'react';
import { ImageSourcePropType } from 'react-native';
import { Banner } from '@/src/types';

/**
 * Theme color palette
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  sale: string;
  tabIconDefault: string;
  tabIconSelected: string;
  shadow: string;
}

/**
 * Toast notification color scheme
 */
export interface ThemeToastColors {
  success: {
    background: string;
    accent: string;
    textColor: string;
    subTextColor: string;
    icon: string;
  };
  error: {
    background: string;
    accent: string;
    textColor: string;
    subTextColor: string;
    icon: string;
  };
  warning: {
    background: string;
    accent: string;
    textColor: string;
    subTextColor: string;
    icon: string;
  };
  info: {
    background: string;
    accent: string;
    textColor: string;
    subTextColor: string;
    icon: string;
  };
  common: {
    closeButtonBackground: string;
    closeIconColor: string;
    borderColor: string;
  };
}

/**
 * Shop branding configuration
 */
export interface ThemeShopConfig {
  /** PNG/JPG image source (used with <Image>) */
  logo?: ImageSourcePropType;
  /** React component for SVG logos — receives width, height, color props */
  LogoComponent?: React.ComponentType<{ width: number; height: number; color?: string }>;
  logoWidth: number;
  logoHeight: number;
  storeName: string;
}

/**
 * HTML rendering styles for product descriptions, etc.
 */
export interface ThemeHtmlStyles {
  text: { fontSize: number; lineHeight: number; color: string };
  paragraph: { fontSize: number; lineHeight: number; color: string; marginBottom: number };
  div: { fontSize: number; lineHeight: number; color: string; marginBottom: number };
  h1: { fontSize: number; fontWeight: '700'; lineHeight: number; color: string; marginTop: number; marginBottom: number };
  h2: { fontSize: number; fontWeight: '700'; lineHeight: number; color: string; marginTop: number; marginBottom: number };
  h3: { fontSize: number; fontWeight: '600'; lineHeight: number; color: string; marginTop: number; marginBottom: number };
  h4: { fontSize: number; fontWeight: '600'; lineHeight: number; color: string; marginTop: number; marginBottom: number };
  list: { marginTop: number; marginBottom: number };
  listItem: { marginBottom: number; paddingLeft: number };
  bullet: { fontSize: number; lineHeight: number; color: string; marginRight: number };
  listItemText: { fontSize: number; lineHeight: number; color: string };
  bold: { fontWeight: '700'; color: string };
  italic: { fontStyle: 'italic' };
}

/**
 * Feature banner type
 */
export interface FeatureBanner {
  type: 'feature';
  id: string;
  features: Array<{
    iconName: string;
    text: string;
  }>;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
}

/**
 * Image banner type
 */
export interface ImageBanner {
  type: 'image';
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundColor?: string;
  textColor?: string;
}

/**
 * Promo bar banner type
 */
export interface PromoBarBanner {
  type: 'promo-bar';
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  height?: number;
  link?: string;
}

export type HomepageSectionBanner = FeatureBanner | ImageBanner | PromoBarBanner;

export interface BannerPosition {
  banner: HomepageSectionBanner;
  position:
    | 'before-recently-viewed'
    | 'after-recently-viewed'
    | 'after-featured'
    | 'after-new-arrival'
    | 'after-all';
}

/**
 * App configuration overrides per theme
 */
export interface ThemeConfigOverrides {
  mode?: 'demo' | 'production';
  demo?: {
    url?: string;
    testEmail?: string;
    testPassword?: string;
  };
  price?: {
    precision?: number;
  };
  shoppingList?: {
    defaultPageSize?: number;
  };
  recentlyViewed?: {
    maxProducts?: number;
    listingRecentlyViewed?: number;
  };
  featuredProducts?: {
    maxProducts?: number;
    listingFeaturedProducts?: number;
  };
  newArrival?: {
    maxProducts?: number;
    listingNewArrival?: number;
  };
}

/**
 * Theme metadata
 */
export interface ThemeMeta {
  /** Unique theme identifier (e.g., 'golden-carbon') */
  id: string;
  /** Human-readable name (e.g., 'Golden Carbon') */
  name: string;
  /** Short description of the theme */
  description: string;
  /** Theme version */
  version: string;
  /** Theme author */
  author?: string;
}

/**
 * Complete theme definition
 *
 * A theme bundles together all visual configuration for the app:
 * colors, toast styles, branding, HTML rendering, banners, and optional config overrides.
 */
export interface Theme {
  /** Theme metadata */
  meta: ThemeMeta;
  /** Color palette */
  colors: ThemeColors;
  /** Toast notification colors */
  toastColors: ThemeToastColors;
  /** Shop branding (logo, store name) */
  shopConfig: ThemeShopConfig;
  /** HTML description rendering styles */
  htmlStyles: ThemeHtmlStyles;
  /** Homepage carousel banners */
  homepageBanners: Banner[];
  /** Homepage section banners (between content blocks) */
  homepageSectionBanners: BannerPosition[];
  /** Optional AppConfig overrides */
  configOverrides?: ThemeConfigOverrides;
}
