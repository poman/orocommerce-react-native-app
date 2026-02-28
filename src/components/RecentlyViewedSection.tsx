/**
 * Recently Viewed Products Section Component
 * Displays a horizontal list of recently viewed products on the homepage
 * Only shows when there are 2+ items
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { ProductCard } from '@/src/components/ProductCard';
import { IProduct } from '@/src/api/helpers/products';
import { ChevronRight } from '@/src/libs/Icon';
import { ThemeColors } from '@/src/themes/types';

interface RecentlyViewedSectionProps {
  products: IProduct[];
  baseUrl: string;
  isInWishlist: (productId: string) => boolean;
  onToggleWishlist: (productId: string, productSku: string) => void;
  cardWidth: number;
  isLoading?: boolean;
}

export const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  products,
  baseUrl,
  isInWishlist,
  onToggleWishlist,
  cardWidth,
  isLoading = false,
}) => {
  const { colors: ShopColors, effectiveConfig } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();

  // Don't show if less than 1 items
  if (!isLoading && products.length < 1) {
    return null;
  }

  const displayedProducts = products.slice(0, effectiveConfig.recentlyViewed.maxProducts);

  const handleViewMore = () => {
    router.push('/recently-viewed' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recently Viewed</Text>
        {/* Always show View All when section is displayed */}
        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={handleViewMore}
          activeOpacity={0.7}
        >
          <Text style={styles.viewMoreText}>View All</Text>
          <ChevronRight size={16} color={ShopColors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={ShopColors.primary} />
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {displayedProducts.map(product => (
            <View key={product.id} style={[styles.productWrapper, { width: cardWidth }]}>
              <ProductCard
                product={product}
                baseUrl={baseUrl}
                isInWishlist={isInWishlist(product.id)}
                onToggleWishlist={onToggleWishlist}
                width={cardWidth}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  productWrapper: {
    marginHorizontal: 0,
  },
});
