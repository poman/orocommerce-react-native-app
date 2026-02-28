import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { ProductCard } from '@/src/components/ProductCard';
import { useShop } from '@/src/context/ShopContext';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { useProducts } from '@/src/api/hooks/useProducts';
import { getResponsiveLayout } from '@/src/utils/responsive';
import { ArrowLeft, Search, RefreshCw } from '@/src/libs/Icon';
import { TopMainMenu } from '@/src/components/TopMainMenu';
import { FooterNavigation } from '@/src/components/FooterNavigation';
import { ThemeColors } from '@/src/themes/types';

export default function FeaturedProductsScreen() {
  const { colors: ShopColors, effectiveConfig } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useShop();
  const { baseUrl } = useConfig();
  const { getValidAccessToken, refreshAccessToken } = useAuth();
  const [layout, setLayout] = useState(getResponsiveLayout());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setLayout(getResponsiveLayout());
    });

    return () => subscription?.remove();
  }, []);

  const { loading, error, products, refetch } = useProducts(
    {
      page: { number: 1, size: effectiveConfig.featuredProducts.listingFeaturedProducts },
      sort: '-updatedAt',
      filter: { featured: 'true' },
      include: 'images,inventoryStatus',
    },
    baseUrl,
    getValidAccessToken,
    refreshAccessToken
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Header */}
        <View style={styles.stickyHeaderWrapper}>
          <View style={styles.stickyHeader}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)')}>
              <ArrowLeft size={24} color={ShopColors.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Featured Products</Text>

            <View style={styles.headerRightButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Search size={24} color={ShopColors.text} />
              </TouchableOpacity>

              <TopMainMenu />
            </View>
          </View>
        </View>

        <View style={styles.contentWrapper}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Item Count */}
              {products.length > 0 && !loading && (
                <View style={styles.actionsBar}>
                  <Text style={styles.itemCount}>
                    {products.length} {products.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              )}

              {/* Loading State */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={ShopColors.primary} />
                  <Text style={styles.loadingText}>Loading featured products...</Text>
                </View>
              )}

              {/* Error State */}
              {error && !loading && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Error loading products</Text>
                  <Text style={styles.errorDetail}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                    <RefreshCw size={16} color="#FFFFFF" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Empty State */}
              {products.length === 0 && !loading && !error && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>⭐</Text>
                  <Text style={styles.emptyTitle}>No Featured Products</Text>
                  <Text style={styles.emptyText}>Check back later for our featured products</Text>
                  <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => router.push('/(tabs)')}
                  >
                    <Text style={styles.shopButtonText}>Browse All Products</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Products Grid */}
              {products.length > 0 && !loading && (
                <View style={styles.productsGrid}>
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      baseUrl={baseUrl}
                      isInWishlist={isInWishlist(product.id)}
                      onToggleWishlist={toggleWishlist}
                      width={layout.cardWidth}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Footer Navigation */}
        <FooterNavigation activeTab="home" />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  stickyHeaderWrapper: {
    backgroundColor: ShopColors.background,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ShopColors.text,
    flex: 1,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contentWrapper: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.textSecondary,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: ShopColors.textSecondary,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.error,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: ShopColors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  shopButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: ShopColors.primary,
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});
