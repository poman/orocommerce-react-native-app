import { Platform } from 'react-native';
import { Banner } from '@/src/types';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Shop-specific colors
export const ShopColors = {
  primary: '#93703a', //#1A1F36
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
};

// Toast notification colors - easily configurable
export const ToastColors = {
  // Success toast (green)
  success: {
    background: '#DCFCE7',
    accent: '#16A34A',
    textColor: '#14532D',
    subTextColor: '#166534',
    icon: '✓',
  },
  // Error toast (red)
  error: {
    background: '#FEE2E2',
    accent: '#DC2626',
    textColor: '#7F1D1D',
    subTextColor: '#991B1B',
    icon: '✕',
  },
  // Warning toast (amber/orange)
  warning: {
    background: '#FEF3C7',
    accent: '#D97706',
    textColor: '#78350F',
    subTextColor: '#92400E',
    icon: '!',
  },
  // Info toast (blue)
  info: {
    background: '#DBEAFE',
    accent: '#2563EB',
    textColor: '#1E3A8A',
    subTextColor: '#1E40AF',
    icon: 'i',
  },
  // Common toast styling
  common: {
    closeButtonBackground: 'rgba(0, 0, 0, 0.08)',
    closeIconColor: '#6B7280',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
};

export const ShopConfig = {
  // Logo shown in header (can be changed to any local asset)
  logo: require('@/assets/images/oro_logo_horizontal.png'),
  logoWidth: 200,
  logoHeight: 40,
  storeName: 'B2B Lighting & Medical Supplies',
};

// HTML Description Styles
// Customize how product descriptions are rendered throughout the app
export const HtmlStyles = {
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: ShopColors.textSecondary,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: ShopColors.textSecondary,
    marginBottom: 12,
  },
  div: {
    fontSize: 15,
    lineHeight: 24,
    color: ShopColors.textSecondary,
    marginBottom: 8,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    color: ShopColors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
    color: ShopColors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
    color: ShopColors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: ShopColors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  list: {
    marginTop: 8,
    marginBottom: 12,
  },
  listItem: {
    marginBottom: 6,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 24,
    color: ShopColors.textSecondary,
    marginRight: 8,
  },
  listItemText: {
    fontSize: 15,
    lineHeight: 24,
    color: ShopColors.textSecondary,
  },
  bold: {
    fontWeight: '700' as const,
    color: ShopColors.text,
  },
  italic: {
    fontStyle: 'italic' as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Homepage Banner Configuration
export const HomepageBanners: Banner[] = [
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
];

// Homepage Section Banners (between blocks)
// These banners appear between content sections and can link to landing pages or other routes
export interface FeatureBanner {
  type: 'feature';
  id: string;
  features: Array<{
    iconName: string; // Icon name from Icon.tsx (e.g. 'check-circle', 'truck', 'shield')
    text: string;
  }>;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
}

export interface ImageBanner {
  type: 'image';
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string; // Can be landing page ID or route
  backgroundColor?: string;
  textColor?: string;
}

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

export const HomepageSectionBanners: BannerPosition[] = [
  {
    banner: {
      type: 'feature',
      id: 'features-banner',
      backgroundColor: ShopColors.border,
      textColor: ShopColors.text,
      iconColor: ShopColors.primary,
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
      textColor: ShopColors.background,
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
      textColor: ShopColors.background,
    },
    position: 'after-featured',
  },
  {
    banner: {
      type: 'promo-bar',
      id: 'first-order-promo',
      text: '🎯 Volume pricing available — contact sales for quotes',
      backgroundColor: ShopColors.secondary,
      textColor: ShopColors.background,
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
];
