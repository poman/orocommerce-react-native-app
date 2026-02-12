import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { RefreshCw, Package } from '@/src/libs/Icon';
import { HtmlRenderer } from '@/src/components/HtmlRenderer';
import { useShop } from '@/src/context/ShopContext';
import { useConfig } from '@/src/context/ConfigContext';
import { ShopColors, HomepageBanners , HomepageSectionBanners } from '@/src/constants/theme';
import { useProducts } from '@/src/api/hooks/useProducts';
import { useCategories } from '@/src/api/hooks/useCategories';
import { ProductCardSkeleton } from '@/src/components/ProductCardSkeleton';
import { ProductCard } from '@/src/components/ProductCard';
import { getResponsiveLayout } from '@/src/utils/responsive';
import { ShopHeader } from '@/src/components/ShopHeader';
import { useAuth } from '@/src/context/AuthContext';
import { useRecentlyViewed } from '@/src/api/hooks/useRecentlyViewed';
import { RecentlyViewedSection } from '@/src/components/RecentlyViewedSection';
import { FeaturedProductsSection } from '@/src/components/FeaturedProductsSection';
import { NewArrivalSection } from '@/src/components/NewArrivalSection';
import { SectionBanner } from '@/src/components/SectionBanner';
import { getProductsByIds , IProduct } from '@/src/api/helpers/products';
import { AppConfig } from '@/src/constants/config';
import { ConfigWizard } from '@/src/components/ConfigWizard';
import { useApiErrorHandler } from '@/src/api/hooks/useApiErrorHandler';

export default function HomeScreen() {
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useShop();
  const { baseUrl } = useConfig();
  const { isAuthenticated, getValidAccessToken, refreshAccessToken } = useAuth();
  const { recentlyViewedIds, isLoading: _loadingRecentlyViewedIds } = useRecentlyViewed();
  const { errorState, handleApiError, closeWizard, resetError: _resetError, showSignIn, dismissSignIn: _dismissSignIn } = useApiErrorHandler();

  const [activeBanner, setActiveBanner] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [layout, setLayout] = useState(getResponsiveLayout());
  const [activeTab, setActiveTab] = useState<'home' | 'catalog'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<IProduct[]>([]);
  const [loadingRecentlyViewed, setLoadingRecentlyViewed] = useState(false);
  const [wizardJustCompleted, setWizardJustCompleted] = useState(false);

  const { loading: _loading, error, products: _apiProducts, refetch } = useProducts(
    {
      page: { number: 1, size: 10 },
      sort: '-id',
      include: 'images,inventoryStatus',
    },
    baseUrl,
    getValidAccessToken,
    refreshAccessToken
  );

  const {
    loading: loadingFeaturedProducts,
    error: errorFeaturedProducts,
    products: featuredProductsData,
    refetch: refetchFeaturedProducts,
  } = useProducts(
    {
      page: { number: 1, size: AppConfig.featuredProducts.maxProducts },
      sort: '-updatedAt',
      filter: { featured: 'true' },
      include: 'images,inventoryStatus',
    },
    baseUrl,
    getValidAccessToken,
    refreshAccessToken
  );

  const {
    loading: loadingNewArrivalProducts,
    error: errorNewArrivalProducts,
    products: newArrivalProductsData,
    refetch: refetchNewArrivalProducts,
  } = useProducts(
    {
      page: { number: 1, size: AppConfig.newArrival.maxProducts },
      sort: '-updatedAt',
      filter: { newArrival: 'true' },
      include: 'images,inventoryStatus',
    },
    baseUrl,
    getValidAccessToken,
    refreshAccessToken
  );

  const {
    categories,
    refetch: refetchCategories,
  } = useCategories(
    {
      page: { number: 1, size: 100 },
    },
    baseUrl,
    getValidAccessToken,
    refreshAccessToken
  );

  const catalogProductsParams = React.useMemo(() => {
    if (!selectedCategory) return undefined;

    const params: any = {
      page: { number: 1, size: 20 },
      sort: 'id',
      include: 'images,inventoryStatus',
    };

    if (selectedCategory !== '1') {
      params.filter = { category: selectedCategory };
    }

    return params;
  }, [selectedCategory]);

  const {
    loading: loadingCatalogProducts,
    error: catalogProductsError,
    products: catalogProducts,
    refetch: refetchCatalogProducts,
  } = useProducts(
    catalogProductsParams,
    baseUrl,
    getValidAccessToken,
    refreshAccessToken
  );

  React.useEffect(() => {
    if (activeTab === 'catalog' && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, activeTab, selectedCategory]);

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setLayout(getResponsiveLayout());
    });

    return () => subscription?.remove();
  }, []);

  React.useEffect(() => {
    const anyError: any = error || errorFeaturedProducts || errorNewArrivalProducts;
    if (anyError) {
      const is401 = anyError?.response?.status === 401;

      if (is401 && !isAuthenticated) {
        setTimeout(() => {
          showSignIn();
        }, 300);
      } else {
        handleApiError(anyError);
      }
    }
  }, [error, errorFeaturedProducts, errorNewArrivalProducts, isAuthenticated, baseUrl]);

  React.useEffect(() => {
    const anyError: any = error || errorFeaturedProducts || errorNewArrivalProducts;
    const is401 = anyError?.response?.status === 401;

    if (wizardJustCompleted && is401 && !isAuthenticated) {
      setWizardJustCompleted(false);
      setTimeout(() => {
        showSignIn();
      }, 300);
    }
  }, [wizardJustCompleted, error, errorFeaturedProducts, errorNewArrivalProducts, isAuthenticated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'home') {
      refetch();
      refetchFeaturedProducts();
      refetchNewArrivalProducts();
    } else {
      refetchCategories();
      refetchCatalogProducts();
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleTabChange = (tab: 'home' | 'catalog') => {
    setActiveTab(tab);
    if (tab === 'catalog' && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };


  const handleBannerPress = (banner: typeof HomepageBanners[0]) => {
    if (banner.link) {
      if (banner.link.startsWith('/')) {
        router.push(banner.link as any);
      } else {
        router.push(`/landing-page/${banner.link}` as any);
      }
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / layout.bannerWidth);
    setActiveBanner(index);
  };

  const renderBannerDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {HomepageBanners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeBanner ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    );
  };

  React.useEffect(() => {
    const fetchRecentlyViewedProducts = async () => {
      setLoadingRecentlyViewed(true);
      try {
        const products = await getProductsByIds(recentlyViewedIds, baseUrl, getValidAccessToken);

        const sortedProducts = recentlyViewedIds
          .map(sku => products.find(p => p.attributes.sku === sku))
          .filter((p): p is IProduct => p !== undefined);

        setRecentlyViewedProducts(sortedProducts);
      } catch (error: any) {
        if (error?.response?.status === 401) {
          handleApiError(error);

          if (!isAuthenticated && baseUrl) {
            setTimeout(() => {
              showSignIn();
            }, 500);
          }
        }
      } finally {
        setLoadingRecentlyViewed(false);
      }
    };

    if (recentlyViewedIds.length > 1) {
      fetchRecentlyViewedProducts();
    } else {
      setRecentlyViewedProducts([]);
    }
  }, [recentlyViewedIds, baseUrl, getValidAccessToken, isAuthenticated]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <ShopHeader
          showTabs={true}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

      <ConfigWizard
        visible={errorState.showWizard && !errorState.showSignInPrompt}
        onComplete={async () => {
          closeWizard();
          setWizardJustCompleted(true);
          await handleRefresh();
        }}
        canDismiss={!errorState.isUnauthorized}
        reason={errorState.wizardReason || 'missing_config'}
      />

      {errorState.showSignInPrompt && !isAuthenticated ? (
          <View style={styles.guestContainerWrapper}>
            <View style={styles.guestContainer}>
              <Package size={80} color={ShopColors.textSecondary} />
              <Text style={styles.guestTitle}>Sign in to browse products</Text>
              <Text style={styles.guestText}>
                Guest Storefront API is disabled. Please sign in to access the catalog and browse products.
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/(auth)/login?redirect=/')}
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

        {/* HOME Tab Content */}
        {activeTab === 'home' && (
          <>
        <View style={styles.bannerSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={layout.bannerWidth + 32}
            contentContainerStyle={styles.bannerScrollContent}
          >
            {HomepageBanners.map((banner, index) => (
              <TouchableOpacity
                key={banner.id}
                style={[
                  styles.bannerCard,
                  {
                    width: layout.bannerWidth,
                    marginLeft: index === 0 ? 16 : 0,
                    marginRight: 16,
                  }
                ]}
                onPress={() => handleBannerPress(banner)}
                activeOpacity={banner.link ? 0.9 : 1}
                disabled={!banner.link}
              >
                <Image
                  source={{ uri: banner.image }}
                  style={styles.bannerImage}
                />
                <View style={styles.bannerOverlay}>
                  {banner.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{banner.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {renderBannerDots()}
        </View>

        {/* Section Banner before Recently Viewed */}
        {HomepageSectionBanners.filter(b => b.position === 'before-recently-viewed').map(({ banner }) => (
          <SectionBanner
            key={banner.id}
            banner={banner}
            width={layout.constrainedWidth}
          />
        ))}

        {/* Recently Viewed Section */}
        <RecentlyViewedSection
          products={recentlyViewedProducts}
          baseUrl={baseUrl}
          isInWishlist={isInWishlist}
          onToggleWishlist={toggleWishlist}
          cardWidth={layout.cardWidth}
          isLoading={loadingRecentlyViewed}
        />

        {/* Section Banner after Recently Viewed */}
        {HomepageSectionBanners.filter(b => b.position === 'after-recently-viewed').map(({ banner }) => (
          <SectionBanner
            key={banner.id}
            banner={banner}
            width={layout.constrainedWidth}
          />
        ))}

        {/* Featured Products Section */}
        <FeaturedProductsSection
          products={featuredProductsData}
          baseUrl={baseUrl}
          isInWishlist={isInWishlist}
          onToggleWishlist={toggleWishlist}
          cardWidth={layout.cardWidth}
          isLoading={loadingFeaturedProducts}
        />

        {/* Section Banner after Featured Products */}
        {HomepageSectionBanners.filter(b => b.position === 'after-featured').map(({ banner }) => (
          <SectionBanner
            key={banner.id}
            banner={banner}
            width={layout.constrainedWidth}
          />
        ))}

        {/* New Arrival Section */}
        <NewArrivalSection
          products={newArrivalProductsData}
          baseUrl={baseUrl}
          isInWishlist={isInWishlist}
          onToggleWishlist={toggleWishlist}
          cardWidth={layout.cardWidth}
          isLoading={loadingNewArrivalProducts}
        />

        {/* Section Banner after New Arrival */}
        {HomepageSectionBanners.filter(b => b.position === 'after-new-arrival').map(({ banner }) => (
          <SectionBanner
            key={banner.id}
            banner={banner}
            width={layout.constrainedWidth}
          />
        ))}

        {/* Section Banner after Trending */}
        {HomepageSectionBanners.filter(b => b.position === 'after-all').map(({ banner }) => (
          <SectionBanner
            key={banner.id}
            banner={banner}
            width={layout.constrainedWidth}
          />
        ))}
        </>
        )}

        {/* CATALOG Tab Content */}
        {activeTab === 'catalog' && (
          <>
            {/* Categories */}
            <View style={styles.categoriesSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && styles.categoryChipActive,
                    ]}
                    onPress={() => handleCategorySelect(category.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === category.id &&
                        styles.categoryChipTextActive,
                      ]}
                    >
                      {category.attributes.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Catalog Products Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedCategory
                  ? categories.find(c => c.id === selectedCategory)?.attributes.title || 'Products'
                  : 'All Products'
                }
              </Text>

              {/* Category Description - Between title and products */}
              {selectedCategory && (
                (() => {
                  const currentCategory = categories.find(c => c.id === selectedCategory);
                  const description = currentCategory?.attributes?.shortDescription ||
                                    currentCategory?.attributes?.description;

                  if (description) {
                    return (
                      <View style={styles.categoryDescriptionSection}>
                        <HtmlRenderer html={description} />
                      </View>
                    );
                  }
                  return null;
                })()
              )}


              {loadingCatalogProducts && (
                <View style={styles.productsGrid}>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <ProductCardSkeleton key={`skeleton-${index}`} width={layout.cardWidth} />
                  ))}
                </View>
              )}

              {catalogProductsError && (
                <View style={styles.errorContainer}>
                  <View style={styles.errorContent}>
                    <View style={styles.errorTextContainer}>
                      <Text style={styles.errorText}>Error loading products</Text>
                      <Text style={styles.errorDetail}>{catalogProductsError}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.reloadIconButton}
                      onPress={refetchCatalogProducts}
                    >
                      <RefreshCw size={24} color={ShopColors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!loadingCatalogProducts && !catalogProductsError && catalogProducts.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No products found in this category</Text>
                </View>
              )}

              {!loadingCatalogProducts && !catalogProductsError && catalogProducts.length > 0 && (
                <View style={styles.productsGrid}>
                  {catalogProducts.map((product) => (
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
          </>
        )}

        </View>
      </ScrollView>
        )
      }
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
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.primary,
    letterSpacing: 2,
  },
  logoTextAccent: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.secondary,
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 16,
  },
  headerIcon: {
    padding: 4,
  },
  bannerSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  bannerScrollContent: {
    gap: 0,
  },
  bannerCard: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: ShopColors.cardBackground,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  badge: {
    backgroundColor: ShopColors.sale,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: ShopColors.primary,
    width: 24,
  },
  inactiveDot: {
    backgroundColor: ShopColors.border,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    padding: 16,
    color: ShopColors.textSecondary,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FEE',
    borderRadius: 8,
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: ShopColors.textSecondary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  productCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 4,
    lineHeight: 18,
    height: 36,
  },
  productSku: {
    fontSize: 11,
    color: ShopColors.textSecondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  originalPrice: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: ShopColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Catalog Tab Styles
  categoriesSection: {
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: ShopColors.background,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: ShopColors.cardBackground,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  categoryChipActive: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  categoryDescriptionSection: {
    marginTop: -8,
    marginBottom: 16,
  },
  recentlyViewedSection: {
    marginTop: 32,
    width: '100%',
  },
  guestContainerWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
