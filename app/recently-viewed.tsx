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
import { useRecentlyViewed } from '@/src/api/hooks/useRecentlyViewed';
import { getProductsByIds, IProduct } from '@/src/api/helpers/products';
import { getResponsiveLayout } from '@/src/utils/responsive';
import { ArrowLeft, Search, Trash2 } from '@/src/libs/Icon';
import { TopMainMenu } from '@/src/components/TopMainMenu';
import { FooterNavigation } from '@/src/components/FooterNavigation';
import { ThemeColors } from '@/src/themes/types';

export default function RecentlyViewedScreen() {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useShop();
  const { baseUrl } = useConfig();
  const { getValidAccessToken } = useAuth();
  const {
    recentlyViewedIds,
    isLoading: loadingIds,
    clearRecentlyViewed,
    refetch,
  } = useRecentlyViewed();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState(getResponsiveLayout());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setLayout(getResponsiveLayout());
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (recentlyViewedIds.length === 0) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      setError(null);

      try {
        const fetchedProducts = await getProductsByIds(
          recentlyViewedIds,
          baseUrl,
          getValidAccessToken
        );

        const sortedProducts = recentlyViewedIds
          .map(sku => fetchedProducts.find((p: IProduct) => p.attributes.sku === sku))
          .filter((p): p is IProduct => p !== undefined);

        setProducts(sortedProducts);
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [recentlyViewedIds, baseUrl, getValidAccessToken]);

  const handleClearAll = async () => {
    await clearRecentlyViewed();
  };

  const isLoading = loadingIds || isLoadingProducts;

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

            <Text style={styles.headerTitle}>Recently Viewed</Text>

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
              {/* Actions Bar */}
              {products.length > 0 && !isLoading && (
                <View style={styles.actionsBar}>
                  <Text style={styles.itemCount}>
                    {products.length} {products.length === 1 ? 'item' : 'items'}
                  </Text>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearAll}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={ShopColors.error} />
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Loading State */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={ShopColors.primary} />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Error loading products</Text>
                  <Text style={styles.errorDetail}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Empty State */}
              {products.length === 0 && !isLoading && !error && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No Viewed Products</Text>
                  <Text style={styles.emptyText}>Products you&apos;ve viewed will appear here</Text>
                  <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => router.push('/(tabs)')}
                  >
                    <Text style={styles.shopButtonText}>Start Shopping</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Products Grid */}
              {products.length > 0 && !isLoading && (
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
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: ShopColors.background,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.error,
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
