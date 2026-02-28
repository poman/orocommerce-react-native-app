import { AppConfig } from '@/src/themes/config';
import { ThemeConfigOverrides } from '@/src/themes/types';

/**
 * Effective app configuration — AppConfig merged with theme overrides.
 *
 * The structure mirrors AppConfig but all values are mutable
 * (the original AppConfig is `as const`).
 */
export interface EffectiveConfig {
  mode: 'demo' | 'production';
  demo: {
    url: string;
    testEmail: string;
    testPassword: string;
  };
  price: {
    precision: number;
  };
  shoppingList: {
    defaultPageSize: number;
  };
  recentlyViewed: {
    maxProducts: number;
    listingRecentlyViewed: number;
  };
  featuredProducts: {
    maxProducts: number;
    listingFeaturedProducts: number;
  };
  newArrival: {
    maxProducts: number;
    listingNewArrival: number;
  };
}

/**
 * Deep-merge AppConfig with theme-level configOverrides.
 *
 * Theme overrides win when present; everything else falls through
 * to the original AppConfig defaults.
 */
export function buildEffectiveConfig(overrides?: ThemeConfigOverrides): EffectiveConfig {
  return {
    mode: overrides?.mode ?? AppConfig.mode,
    demo: {
      url: overrides?.demo?.url ?? AppConfig.demo.url,
      testEmail: overrides?.demo?.testEmail ?? AppConfig.demo.testEmail,
      testPassword: overrides?.demo?.testPassword ?? AppConfig.demo.testPassword,
    },
    price: {
      precision: overrides?.price?.precision ?? AppConfig.price.precision,
    },
    shoppingList: {
      defaultPageSize: overrides?.shoppingList?.defaultPageSize ?? AppConfig.shoppingList.defaultPageSize,
    },
    recentlyViewed: {
      maxProducts: overrides?.recentlyViewed?.maxProducts ?? AppConfig.recentlyViewed.maxProducts,
      listingRecentlyViewed: overrides?.recentlyViewed?.listingRecentlyViewed ?? AppConfig.recentlyViewed.listingRecentlyViewed,
    },
    featuredProducts: {
      maxProducts: overrides?.featuredProducts?.maxProducts ?? AppConfig.featuredProducts.maxProducts,
      listingFeaturedProducts: overrides?.featuredProducts?.listingFeaturedProducts ?? AppConfig.featuredProducts.listingFeaturedProducts,
    },
    newArrival: {
      maxProducts: overrides?.newArrival?.maxProducts ?? AppConfig.newArrival.maxProducts,
      listingNewArrival: overrides?.newArrival?.listingNewArrival ?? AppConfig.newArrival.listingNewArrival,
    },
  };
}
