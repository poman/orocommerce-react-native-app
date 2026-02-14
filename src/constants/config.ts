/**
 * App mode: 'demo' or 'production'
 * - demo: Shows test login, settings page is accessible, demo URL credentials are hidden
 * - production: Hides test login, settings page and wizard are hidden
 */
export type AppMode = 'demo' | 'production';

export const AppConfig = {
  /**
   * Application mode
   * - 'demo': For testing/demo purposes, shows test login credentials
   * - 'production': For production use, hides test login and settings
   */
  mode: 'demo' as AppMode,

  /**
   * Demo environment configuration
   * This URL is used to determine if we should hide credentials in the UI
   */
  demo: {
    /** The demo environment URL - when this URL is active, credentials are hidden in settings */
    url: 'https://orocommerce.space/',
    /** Test user email shown on login page in demo mode */
    testEmail: 'AmandaRCole@example.org',
    /** Test user password (same as email for demo) */
    testPassword: 'AmandaRCole@example.org',
  },

  /**
   * Price formatting configuration
   */
  price: {
    /**
     * Number of decimal places to show for prices
     * @default 2
     */
    precision: 2,
  },

  /**
   * Shopping list configuration
   */
  shoppingList: {
    /**
     * Default page size for fetching shopping list items and shopping lists
     */
    defaultPageSize: 100,
  },

  /**
   * Recently viewed products configuration
   */
  recentlyViewed: {
    /**
     * Maximum products in recently viewed block on homepage
     * @default 4
     */
    maxProducts: 4,
    /**
     * Maximum products to show on recently viewed listing page
     * @default 25
     */
    listingRecentlyViewed: 25,
  },

  /**
   * Featured products configuration
   */
  featuredProducts: {
    /**
     * Maximum products in featured block
     * @default 4
     */
    maxProducts: 4,
    /**
     * Maximum products to show on featured products listing page
     * @default 25
     */
    listingFeaturedProducts: 25,
  },

  /**
   * New arrival products configuration
   */
  newArrival: {
    /**
     * Maximum products in new arrival block
     * @default 4
     */
    maxProducts: 4,
    /**
     * Maximum products to show on new arrival listing page
     * @default 25
     */
    listingNewArrival: 25,
  },
} as const;

/**
 * Helper function to check if app is in demo mode
 */
export const isDemoMode = (): boolean => {
  return AppConfig.mode === 'demo';
};

/**
 * Helper function to check if app is in production mode
 */
export const isProductionMode = (): boolean => {
  return AppConfig.mode === 'production';
};
/**
 * Helper function to check if the given URL is the demo URL
 */
export const isDemoUrl = (url: string): boolean => {
  if (!url) return false;
  const normalizedUrl = url.trim().toLowerCase().replace(/\/+$/, '');
  const normalizedDemoUrl = AppConfig.demo.url.trim().toLowerCase().replace(/\/+$/, '');
  return normalizedUrl === normalizedDemoUrl;
};
