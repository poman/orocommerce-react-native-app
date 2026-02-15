import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Heart, RefreshCw, Package } from '@/src/libs/Icon';
import { useShop } from '@/src/context/ShopContext';
import { ShopColors } from '@/src/constants/theme';
import { useWishlistProducts } from '@/src/api/hooks/useWishlistProducts';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { ShopHeader } from '@/src/components/ShopHeader';
import { ProductCardSkeleton } from '@/src/components/ProductCardSkeleton';
import { ProductCard } from '@/src/components/ProductCard';
import { getResponsiveLayout } from '@/src/utils/responsive';

export default function WishlistScreen() {
  const router = useRouter();
  const { wishlistSkus, toggleWishlist } = useShop();
  const { baseUrl } = useConfig();
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [layout, setLayout] = React.useState(getResponsiveLayout());

  const reversedSkus = React.useMemo(() => {
    return [...wishlistSkus].reverse();
  }, [wishlistSkus]);

  const { loading, error, products: wishlistProducts, refetch } = useWishlistProducts(reversedSkus);

  // Sort products to match the order of reversedSkus (most recently added first)
  const sortedProducts = React.useMemo(() => {
    if (!wishlistProducts || wishlistProducts.length === 0) return [];

    return [...wishlistProducts].sort((a, b) => {
      const indexA = reversedSkus.indexOf(a.attributes.sku);
      const indexB = reversedSkus.indexOf(b.attributes.sku);
      return indexA - indexB;
    });
  }, [wishlistProducts, reversedSkus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setLayout(getResponsiveLayout());
    });

    return () => subscription?.remove();
  }, []);

  // Loading state - no header
  if (loading && wishlistSkus.length > 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ShopColors.primary} />
            <Text style={styles.loadingText}>Loading your wishlist...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (wishlistSkus.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />

          <ShopHeader />

          <View style={styles.emptyContainer}>
            <Heart size={64} color={ShopColors.textSecondary} />
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptyText}>Save your favorite items here</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <ShopHeader />

        {/* Check for 401 error and show sign-in prompt */}
        {error?.response?.status === 401 && !isAuthenticated ? (
          <View style={styles.guestContainerWrapper}>
            <View style={styles.guestContainer}>
              <Package size={80} color={ShopColors.textSecondary} />
              <Text style={styles.guestTitle}>Sign in to view your wishlist</Text>
              <Text style={styles.guestText}>
                Please sign in to access your saved items and wishlist.
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/(auth)/login?redirect=/wishlist')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center' }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={ShopColors.primary}
                colors={[ShopColors.primary]}
              />
            }
          >
            <View style={[styles.contentWrapper, { maxWidth: layout.constrainedWidth }]}>
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <Text style={styles.headerTitle}>My Wishlist</Text>
                  <Text style={styles.itemCount}>
                    {wishlistSkus.length} {wishlistSkus.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.refreshButton} onPress={refetch}>
                  <RefreshCw size={20} color={ShopColors.primary} />
                </TouchableOpacity>
              </View>

              {loading && (
                <View style={styles.productsGrid}>
                  {Array.from({ length: wishlistSkus.length }).map((_, index) => (
                    <ProductCardSkeleton key={`skeleton-${index}`} width={layout.cardWidth} />
                  ))}
                </View>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <View style={styles.errorContent}>
                    <View style={styles.errorTextContainer}>
                      <Text style={styles.errorText}>Error loading wishlist</Text>
                      <Text style={styles.errorDetail}>
                        {error?.response?.data?.errors?.[0]?.detail ||
                          error?.message ||
                          'Failed to load wishlist'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.reloadIconButton} onPress={refetch}>
                      <RefreshCw size={24} color={ShopColors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!loading && !error && sortedProducts.length > 0 && (
                <View style={styles.productsGrid}>
                  {sortedProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      baseUrl={baseUrl}
                      isInWishlist={true}
                      onToggleWishlist={toggleWishlist}
                      width={layout.cardWidth}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: ShopColors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ShopColors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 10,
  },
  itemCount: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    fontWeight: '500',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ShopColors.background,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FEE',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.error,
    marginBottom: 4,
  },
  errorDetail: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  reloadIconButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  guestContainerWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  guestContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ShopColors.text,
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  guestText: {
    fontSize: 16,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 500,
  },
  loginButton: {
    backgroundColor: ShopColors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
