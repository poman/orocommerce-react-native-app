import { Dimensions } from 'react-native';

export interface ResponsiveLayout {
  constrainedWidth: number;
  cardWidth: number;
  columns: number;
  bannerWidth: number;
}

/**
 * Calculate responsive layout dimensions based on screen width
 *
 * Breakpoints:
 * - Mobile (360-767px): 2 columns (minimum)
 * - Tablet (768-1023px): 3 columns
 * - Desktop (1024px+): 4 columns
 *
 * Features:
 * - Minimum width: 360px (screens smaller than 360px still get 2 columns)
 * - Maximum width: 1200px
 * - Always at least 2 columns (never 1 column layout)
 * - Dynamic card sizing with proper gaps
 * - Centered content on larger screens
 */
export const getResponsiveLayout = (): ResponsiveLayout => {
  const screenWidth = Dimensions.get('window').width;
  const maxWidth = 1200; // Max width for web/tablet
  const minWidth = 320; // Min width for mobile

  const constrainedWidth = Math.max(minWidth, Math.min(screenWidth, maxWidth));

  let columns = 2;
  if (constrainedWidth >= 768) {
    columns = 3;
  }
  if (constrainedWidth >= 1024) {
    columns = 4;
  }

  const horizontalPadding = 16;
  const gap = 16;
  const totalGaps = gap * (columns - 1);
  const availableWidth = constrainedWidth - horizontalPadding * 2 - totalGaps;
  const cardWidth = Math.floor(availableWidth / columns);

  const bannerWidth = constrainedWidth - horizontalPadding * 2;

  return {
    constrainedWidth,
    cardWidth,
    columns,
    bannerWidth,
  };
};
