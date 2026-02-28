import { Theme } from '../types';
import RefreshingTealsLogo from './Logo';

/**
 * Refreshing Teals Theme
 *
 * A modern, cool-toned theme with teal and cyan accents.
 * Conveys innovation, clarity, and a fresh digital-first approach.
 */
const colors = {
  primary: '#0D9488',
  secondary: '#06B6D4',
  background: '#F8FFFE',
  cardBackground: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#E11D48',
  success: '#059669',
  warning: '#D97706',
  sale: '#E11D48',
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#0D9488',
  shadow: '#0F172A',
} as const;

const RefreshingTealsTheme: Theme = {
  meta: {
    id: 'refreshing-teals',
    name: 'Refreshing Teals',
    description: 'Cool teal and cyan tones — modern, fresh, and digitally forward.',
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
      background: '#FFE4E6',
      accent: '#E11D48',
      textColor: '#881337',
      subTextColor: '#9F1239',
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
      background: '#CCFBF1',
      accent: '#0D9488',
      textColor: '#134E4A',
      subTextColor: '#115E59',
      icon: 'i',
    },
    common: {
      closeButtonBackground: 'rgba(0, 0, 0, 0.06)',
      closeIconColor: '#64748B',
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
  },

  shopConfig: {
    LogoComponent: RefreshingTealsLogo,
    logoWidth: 220,
    logoHeight: 32,
    storeName: 'B2B Industrial Marketplace',
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
      title: 'Precision Equipment',
      subtitle: 'Cutting-edge tools for modern facilities',
      badge: 'New Arrivals',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
      link: '/featured-products',
    },
    {
      id: '2',
      title: 'Smart Solutions',
      subtitle: 'IoT-enabled devices for connected workplaces',
      badge: 'Smart Tech',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
      link: '/new-arrival',
    },
    {
      id: '3',
      title: 'Sustainable Supply',
      subtitle: 'Eco-friendly products for responsible businesses',
      badge: 'Green Choice',
      image: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&q=80',
      link: '5',
    },
  ],

  homepageSectionBanners: [
    {
      banner: {
        type: 'feature',
        id: 'features-banner',
        backgroundColor: '#F0FDFA',
        textColor: colors.text,
        iconColor: colors.primary,
        features: [
          { iconName: 'check-circle', text: 'Quality Assured' },
          { iconName: 'truck', text: 'Express Delivery' },
          { iconName: 'shield', text: '24/7 Support' },
        ],
      },
      position: 'before-recently-viewed',
    },
    {
      banner: {
        type: 'image',
        id: 'featured-promo',
        image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=1200&q=80',
        title: 'Top-Rated Products',
        subtitle: 'Trusted by 10,000+ businesses worldwide',
        ctaText: 'Shop Now',
        ctaLink: '/featured-products',
        backgroundColor: 'rgba(6, 182, 212, 0.5)',
        textColor: '#FFFFFF',
      },
      position: 'after-featured',
    },
    {
      banner: {
        type: 'promo-bar',
        id: 'first-order-promo',
        text: '🚀 Free shipping on orders over $500 — limited time offer',
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
        image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80',
        title: 'Partnership Program',
        subtitle: 'Join our network of trusted B2B partners',
        ctaText: 'Learn More',
        ctaLink: '2',
        backgroundColor: 'rgba(13, 148, 136, 0.8)',
        textColor: '#FFFFFF',
      },
      position: 'after-all',
    },
  ],

  configOverrides: {
    // Refreshing Teals uses default config values
  },
};

export default RefreshingTealsTheme;
