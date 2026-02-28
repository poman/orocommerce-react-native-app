import { Theme } from '../types';
import GoldenCarbonLogo from './Logo';

/**
 * Golden Carbon Theme
 *
 * A warm, professional theme with gold accents on a clean white background.
 * Inspired by luxury B2B brands — conveys trust, quality, and sophistication.
 */
const colors = {
  primary: '#93703a',
  secondary: '#2196F3',
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  text: '#1A1F36',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#93703a',
  sale: '#EF4444',
  tabIconDefault: '#9CA3AF',
  tabIconSelected: '#2196F3',
  shadow: '#000000',
} as const;

const GoldenCarbonTheme: Theme = {
  meta: {
    id: 'golden-carbon',
    name: 'Golden Carbon',
    description: 'Warm gold accents on a clean white canvas — professional and refined.',
    version: '1.0.0',
    author: 'OroCommerce',
  },

  colors,

  toastColors: {
    success: {
      background: '#DCFCE7',
      accent: '#16A34A',
      textColor: '#14532D',
      subTextColor: '#166534',
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
      background: '#DBEAFE',
      accent: '#2563EB',
      textColor: '#1E3A8A',
      subTextColor: '#1E40AF',
      icon: 'i',
    },
    common: {
      closeButtonBackground: 'rgba(0, 0, 0, 0.08)',
      closeIconColor: '#6B7280',
      borderColor: 'rgba(0, 0, 0, 0.1)',
    },
  },

  shopConfig: {
    LogoComponent: GoldenCarbonLogo,
    logoWidth: 200,
    logoHeight: 40,
    storeName: 'B2B Lighting & Medical Supplies',
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
      title: 'Industrial Lighting',
      subtitle: 'High-efficiency fixtures for warehouses & facilities',
      badge: 'Lighting Solutions',
      image: 'https://images.unsplash.com/photo-1730584475949-a01e4663003a?w=800&q=80',
      link: '/featured-products',
    },
    {
      id: '2',
      title: 'Medical Equipment',
      subtitle: 'Durable, certified devices for clinics & labs',
      badge: 'Medical Devices',
      image: 'https://images.unsplash.com/photo-1643660526741-094639fbe53a?w=800&q=80',
      link: '/new-arrival',
    },
    {
      id: '3',
      title: 'Control & Automation',
      subtitle: 'Sensors, controls and drivers for smart installations',
      badge: 'Automation',
      image: 'https://images.unsplash.com/photo-1647427060118-4911c9821b82?w=800&q=80',
      link: '5',
    },
  ],

  homepageSectionBanners: [
    {
      banner: {
        type: 'feature',
        id: 'features-banner',
        backgroundColor: colors.border,
        textColor: colors.text,
        iconColor: colors.primary,
        features: [
          { iconName: 'check-circle', text: 'Certified Products' },
          { iconName: 'truck', text: 'Fast B2B Logistics' },
          { iconName: 'shield', text: 'Warranty & Support' },
        ],
      },
      position: 'before-recently-viewed',
    },
    {
      banner: {
        type: 'image',
        id: 'promo-after-recently-viewed',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
        title: 'Lighting Projects',
        subtitle: 'Tailored solutions for industrial installations',
        ctaText: 'Learn More',
        ctaLink: '/new-arrival',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        textColor: colors.background,
      },
      position: 'after-recently-viewed',
    },
    {
      banner: {
        type: 'image',
        id: 'featured-promo',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
        title: 'Medical Devices Showcase',
        subtitle: 'Explore certified clinical equipment',
        ctaText: 'View Catalog',
        ctaLink: '/featured-products',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        textColor: colors.background,
      },
      position: 'after-featured',
    },
    {
      banner: {
        type: 'promo-bar',
        id: 'first-order-promo',
        text: '🎯 Volume pricing available — contact sales for quotes',
        backgroundColor: colors.secondary,
        textColor: colors.background,
        height: 32,
      },
      position: 'after-new-arrival',
    },
    {
      banner: {
        type: 'image',
        id: 'bottom-promo',
        image: 'https://images.unsplash.com/photo-1707301280406-55612d3bb9db?w=1200&q=80',
        title: 'Trusted Suppliers',
        subtitle: 'Long-term partnerships for B2B buyers',
        ctaText: 'Contact Sales',
        ctaLink: '2',
        backgroundColor: 'rgba(147, 112, 58, 0.85)',
        textColor: '#FFFFFF',
      },
      position: 'after-all',
    },
  ],

  configOverrides: {
    // Golden Carbon uses default config values — no overrides needed
  },
};

export default GoldenCarbonTheme;
