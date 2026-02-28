import { Theme } from '../types';
import RoyalIndigoLogo from './Logo';

/**
 * Royal Indigo Theme
 *
 * A bold, deep purple theme that commands authority and trust.
 * Ideal for enterprise, procurement portals, and high-value B2B catalogs.
 *
 * This theme demonstrates configOverrides — it shows 6 products per section
 * instead of the default 4, and uses 3-decimal price precision.
 */
const colors = {
  primary: '#4F46E5',
  secondary: '#7C3AED',
  background: '#FAFAFF',
  cardBackground: '#FFFFFF',
  text: '#1E1B4B',
  textSecondary: '#6366F1',
  border: '#E0E0F0',
  error: '#DC2626',
  success: '#059669',
  warning: '#D97706',
  sale: '#DC2626',
  tabIconDefault: '#A5B4FC',
  tabIconSelected: '#4F46E5',
  shadow: '#1E1B4B',
} as const;

const RoyalIndigoTheme: Theme = {
  meta: {
    id: 'royal-indigo',
    name: 'Royal Indigo',
    description: 'Deep indigo authority — bold, enterprise-grade, and trustworthy.',
    version: '1.0.0',
    author: 'OroCommerce',
  },

  colors,

  toastColors: {
    success: {
      background: '#D1FAE5',
      accent: '#059669',
      textColor: '#064E3B',
      subTextColor: '#065F46',
      icon: '✓',
    },
    error: {
      background: '#FEE2E2',
      accent: '#DC2626',
      textColor: '#7F1D1D',
      subTextColor: '#991B1B',
      icon: '✕',
    },
    warning: {
      background: '#FEF3C7',
      accent: '#D97706',
      textColor: '#78350F',
      subTextColor: '#92400E',
      icon: '!',
    },
    info: {
      background: '#EEF2FF',
      accent: '#4F46E5',
      textColor: '#312E81',
      subTextColor: '#3730A3',
      icon: 'i',
    },
    common: {
      closeButtonBackground: 'rgba(79, 70, 229, 0.08)',
      closeIconColor: '#6366F1',
      borderColor: 'rgba(79, 70, 229, 0.12)',
    },
  },

  shopConfig: {
    LogoComponent: RoyalIndigoLogo,
    logoWidth: 210,
    logoHeight: 32,
    storeName: 'Enterprise Procurement Hub',
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
      title: 'Enterprise Solutions',
      subtitle: 'Scalable procurement for growing organizations',
      badge: 'Enterprise',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
      link: '/featured-products',
    },
    {
      id: '2',
      title: 'Bulk Ordering',
      subtitle: 'Volume discounts and tiered pricing for B2B buyers',
      badge: 'Bulk Pricing',
      image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80',
      link: '/new-arrival',
    },
    {
      id: '3',
      title: 'Compliance & Standards',
      subtitle: 'Industry-certified products meeting regulatory requirements',
      badge: 'Certified',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
      link: '5',
    },
  ],

  homepageSectionBanners: [
    {
      banner: {
        type: 'feature',
        id: 'features-banner',
        backgroundColor: '#EEF2FF',
        textColor: colors.text,
        iconColor: colors.primary,
        features: [
          { iconName: 'shield', text: 'Enterprise Security' },
          { iconName: 'truck', text: 'Global Logistics' },
          { iconName: 'check-circle', text: 'ISO Certified' },
        ],
      },
      position: 'before-recently-viewed',
    },
    {
      banner: {
        type: 'image',
        id: 'promo-after-recently-viewed',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
        title: 'Streamline Procurement',
        subtitle: 'Reduce costs with automated ordering workflows',
        ctaText: 'Get Started',
        ctaLink: '/new-arrival',
        backgroundColor: 'rgba(79, 70, 229, 0.65)',
        textColor: '#FFFFFF',
      },
      position: 'after-recently-viewed',
    },
    {
      banner: {
        type: 'promo-bar',
        id: 'first-order-promo',
        text: '🏢 Enterprise plans available — talk to our sales team',
        backgroundColor: colors.primary,
        textColor: '#FFFFFF',
        height: 32,
      },
      position: 'after-new-arrival',
    },
    {
      banner: {
        type: 'image',
        id: 'bottom-promo',
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&q=80',
        title: 'Trusted by Fortune 500',
        subtitle: 'Powering procurement for the world\'s leading companies',
        ctaText: 'Request Demo',
        ctaLink: '2',
        backgroundColor: 'rgba(30, 27, 75, 0.8)',
        textColor: '#FFFFFF',
      },
      position: 'after-all',
    },
  ],

  /**
   * Config overrides example:
   * - Show 6 products per homepage section (instead of default 4)
   * - Use 3-decimal price precision (for industrial / raw-material pricing)
   * - Show 50 products on listing pages
   */
  configOverrides: {
    price: {
      precision: 3,
    },
    recentlyViewed: {
      maxProducts: 6,
      listingRecentlyViewed: 50,
    },
    featuredProducts: {
      maxProducts: 6,
      listingFeaturedProducts: 50,
    },
    newArrival: {
      maxProducts: 6,
      listingNewArrival: 50,
    },
  },
};

export default RoyalIndigoTheme;
