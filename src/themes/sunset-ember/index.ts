import { Theme } from '../types';
import SunsetEmberLogo from './Logo';

/**
 * Sunset Ember Theme
 *
 * A vibrant, warm theme with red-orange accents and earthy tones.
 * Evokes energy, urgency, and action — great for seasonal promotions
 * or marketplaces that want a bold, attention-grabbing look.
 *
 * This theme demonstrates configOverrides — it shows fewer products
 * per section for a more curated homepage, and uses standard 2-decimal pricing.
 */
const colors = {
  primary: '#DC2626',
  secondary: '#EA580C',
  background: '#FFFBF7',
  cardBackground: '#FFFFFF',
  text: '#1C1917',
  textSecondary: '#78716C',
  border: '#E7E5E4',
  error: '#B91C1C',
  success: '#15803D',
  warning: '#D97706',
  sale: '#DC2626',
  tabIconDefault: '#A8A29E',
  tabIconSelected: '#DC2626',
  shadow: '#1C1917',
} as const;

const SunsetEmberTheme: Theme = {
  meta: {
    id: 'sunset-ember',
    name: 'Sunset Ember',
    description: 'Vibrant red-orange energy — bold, action-driven, and attention-grabbing.',
    version: '1.0.0',
    author: 'OroCommerce',
  },

  colors,

  toastColors: {
    success: {
      background: '#DCFCE7',
      accent: '#15803D',
      textColor: '#14532D',
      subTextColor: '#166534',
      icon: '✓',
    },
    error: {
      background: '#FEF2F2',
      accent: '#B91C1C',
      textColor: '#7F1D1D',
      subTextColor: '#991B1B',
      icon: '✕',
    },
    warning: {
      background: '#FFFBEB',
      accent: '#D97706',
      textColor: '#78350F',
      subTextColor: '#92400E',
      icon: '!',
    },
    info: {
      background: '#FFF7ED',
      accent: '#EA580C',
      textColor: '#7C2D12',
      subTextColor: '#9A3412',
      icon: 'i',
    },
    common: {
      closeButtonBackground: 'rgba(220, 38, 38, 0.08)',
      closeIconColor: '#78716C',
      borderColor: 'rgba(28, 25, 23, 0.08)',
    },
  },

  shopConfig: {
    LogoComponent: SunsetEmberLogo,
    logoWidth: 220,
    logoHeight: 32,
    storeName: 'Hot Deals Marketplace',
  },

  htmlStyles: {
    text: { fontSize: 15, lineHeight: 24, color: colors.textSecondary },
    paragraph: { fontSize: 15, lineHeight: 24, color: colors.textSecondary, marginBottom: 12 },
    div: { fontSize: 15, lineHeight: 24, color: colors.textSecondary, marginBottom: 8 },
    h1: { fontSize: 24, fontWeight: '700', lineHeight: 32, color: colors.text, marginTop: 16, marginBottom: 12 },
    h2: { fontSize: 20, fontWeight: '700', lineHeight: 28, color: colors.text, marginTop: 16, marginBottom: 12 },
    h3: { fontSize: 18, fontWeight: '600', lineHeight: 26, color: colors.text, marginTop: 12, marginBottom: 8 },
    h4: { fontSize: 16, fontWeight: '600', lineHeight: 24, color: colors.text, marginTop: 12, marginBottom: 8 },
    list: { marginTop: 8, marginBottom: 12 },
    listItem: { marginBottom: 6, paddingLeft: 8 },
    bullet: { fontSize: 15, lineHeight: 24, color: colors.textSecondary, marginRight: 8 },
    listItemText: { fontSize: 15, lineHeight: 24, color: colors.textSecondary },
    bold: { fontWeight: '700', color: colors.text },
    italic: { fontStyle: 'italic' },
  },

  homepageBanners: [
    {
      id: '1',
      title: 'Flash Deals',
      subtitle: 'Limited-time offers on top industrial products',
      badge: 'Hot Deal',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      link: '/featured-products',
    },
    {
      id: '2',
      title: 'Clearance Event',
      subtitle: 'Up to 40% off — while supplies last',
      badge: 'Sale',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
      link: '/new-arrival',
    },
    {
      id: '3',
      title: 'Seasonal Stock',
      subtitle: 'Prepare for the next quarter with bulk orders',
      badge: 'Seasonal',
      image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
      link: '5',
    },
  ],

  homepageSectionBanners: [
    {
      banner: {
        type: 'feature',
        id: 'features-banner',
        backgroundColor: '#FEF2F2',
        textColor: colors.text,
        iconColor: colors.primary,
        features: [
          { iconName: 'award', text: 'Best Price Guarantee' },
          { iconName: 'truck', text: 'Same-Day Shipping' },
          { iconName: 'shield', text: 'Buyer Protection' },
        ],
      },
      position: 'before-recently-viewed',
    },
    {
      banner: {
        type: 'promo-bar',
        id: 'urgency-promo',
        text: '🔥 Limited stock — order now before prices go up!',
        backgroundColor: colors.primary,
        textColor: '#FFFFFF',
        height: 32,
      },
      position: 'after-recently-viewed',
    },
    {
      banner: {
        type: 'image',
        id: 'featured-promo',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=1200&q=80',
        title: 'Bulk Savings',
        subtitle: 'The more you order, the more you save',
        ctaText: 'View Deals',
        ctaLink: '/featured-products',
        backgroundColor: 'rgba(234, 88, 12, 0.6)',
        textColor: '#FFFFFF',
      },
      position: 'after-featured',
    },
    {
      banner: {
        type: 'image',
        id: 'bottom-promo',
        image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&q=80',
        title: 'Become a Preferred Buyer',
        subtitle: 'Unlock exclusive pricing tiers and priority fulfillment',
        ctaText: 'Apply Now',
        ctaLink: '2',
        backgroundColor: 'rgba(220, 38, 38, 0.75)',
        textColor: '#FFFFFF',
      },
      position: 'after-all',
    },
  ],

  /**
   * Config overrides example:
   * - Curated homepage with 6 products per section
   * - Smaller listing pages (20 items) for faster loading
   * - Standard 2-decimal pricing
   */
  configOverrides: {
    price: {
      precision: 2,
    },
    recentlyViewed: {
      maxProducts: 6,
      listingRecentlyViewed: 20,
    },
    featuredProducts: {
      maxProducts: 6,
      listingFeaturedProducts: 20,
    },
    newArrival: {
      maxProducts: 6,
      listingNewArrival: 20,
    },
  },
};

export default SunsetEmberTheme;
