import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  PanResponder,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ShopColors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { useConfig } from '@/src/context/ConfigContext';
import { ShopHeader } from '@/src/components/ShopHeader';
import {
  Truck,
  Package,
  RefreshCw,
  CreditCard,
  Search,
  X,
  Filter,
  Check,
  ChevronDown,
} from '@/src/libs/Icon';
import { useOrders } from '@/src/api/hooks/useOrders';
import { IOrder } from '@/src/api/helpers/orders';

const getOrderStatusText = (order: IOrder): string => {
  const statusRelationship = (order as any).relationships?.status?.data;
  if (statusRelationship && statusRelationship.id) {
    const included = (order as any).included || [];
    const statusData = included.find(
      (item: any) => item.type === 'orderstatuses' && item.id === statusRelationship.id
    );
    if (statusData?.attributes?.name) {
      return statusData.attributes.name;
    }
    return statusRelationship.id.charAt(0).toUpperCase() + statusRelationship.id.slice(1);
  }

  const status = (order.attributes as any)?.status || (order.attributes as any)?.internalStatus;
  if (!status) return 'Open';
  if (typeof status === 'string') return status;
  if (typeof status === 'object' && status.label) return String(status.label);
  if (typeof status === 'object' && status.name) return String(status.name);
  return 'Open';
};

const getStatusColorByText = (statusText: string) => {
  const statusLower = statusText.toLowerCase();
  if (statusLower.includes('open') || statusLower.includes('pending')) {
    return ShopColors.primary;
  } else if (statusLower.includes('processing') || statusLower.includes('in_progress')) {
    return '#2196F3';
  } else if (statusLower.includes('shipped') || statusLower.includes('sent')) {
    return ShopColors.primary;
  } else if (
    statusLower.includes('closed') ||
    statusLower.includes('delivered') ||
    statusLower.includes('complete')
  ) {
    return ShopColors.success;
  } else if (statusLower.includes('cancelled') || statusLower.includes('canceled')) {
    return ShopColors.error;
  }
  return ShopColors.textSecondary;
};

const getPaymentStatusColor = (paymentStatus: string) => {
  const statusLower = paymentStatus.toLowerCase();
  if (
    statusLower.includes('paid') ||
    statusLower.includes('completed') ||
    statusLower.includes('authorized')
  ) {
    return ShopColors.success;
  } else if (statusLower.includes('pending') || statusLower.includes('processing')) {
    return '#FF9800';
  } else if (
    statusLower.includes('failed') ||
    statusLower.includes('declined') ||
    statusLower.includes('cancelled')
  ) {
    return ShopColors.error;
  } else if (statusLower.includes('refund')) {
    return '#9C27B0';
  }
  return '#FF9800';
};

const getStatusFilterLabel = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getPaymentFilterLabel = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getTimeFilterLabel = (value: string): string => {
  const timeLabels: Record<string, string> = {
    all: 'All Time',
    '30days': 'Last 30 Days',
    '90days': 'Last 90 Days',
    year: 'This Year',
  };
  return timeLabels[value] || value;
};

const SkeletonImage = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonImage}>
      <Animated.View style={[styles.skeletonShimmer, { opacity }]} />
    </View>
  );
};

export default function OrdersScreen() {
  const router = useRouter();
  const { isAuthenticated, getValidAccessToken } = useAuth();
  const { baseUrl } = useConfig();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'id-desc' | 'id-asc'>(
    'date-desc'
  );

  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string>('all');
  const [appliedSortBy, setAppliedSortBy] = useState<
    'date-desc' | 'date-asc' | 'id-desc' | 'id-asc'
  >('date-desc');

  const handleApplySearch = () => {
    setDebouncedSearchQuery(searchQuery);
  };

  const handleApplyFilters = () => {
    setAppliedStatusFilter(statusFilter);
    setAppliedSortBy(sortBy);
  };

  const handleOpenDrawer = () => {
    setStatusFilter(appliedStatusFilter);
    setSortBy(appliedSortBy);
    setDrawerVisible(true);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setTimeFilter('all');
    setSortBy('date-desc');
    setAppliedStatusFilter('all');
    setAppliedSortBy('date-desc');
  };

  const apiParams = useMemo(() => {
    if (!isAuthenticated) return undefined;

    const params: any = {
      page: { number: 1, size: 3 },
      sort:
        appliedSortBy === 'date-desc'
          ? '-createdAt'
          : appliedSortBy === 'date-asc'
            ? 'createdAt'
            : appliedSortBy === 'id-desc'
              ? '-id'
              : 'id',
      include: 'lineItems,lineItems.product',
    };

    const filters: any = {};

    if (debouncedSearchQuery.trim()) {
      filters.identifier = debouncedSearchQuery.trim();
    }

    if (appliedStatusFilter !== 'all') {
      filters.status = appliedStatusFilter;
    }

    if (Object.keys(filters).length > 0) {
      params.filter = filters;
    }

    return params;
  }, [isAuthenticated, debouncedSearchQuery, appliedStatusFilter, appliedSortBy]);

  const { loading, error, orders, refetch, included } = useOrders(
    apiParams,
    baseUrl,
    getValidAccessToken
  );

  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [allOrders, setAllOrders] = useState<IOrder[]>([]);
  const [allIncluded, setAllIncluded] = useState<any[]>([]);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [drawerVisible, setDrawerVisible] = useState(false);

  const [statusExpanded, setStatusExpanded] = useState(false);
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [timeExpanded, setTimeExpanded] = useState(false);

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const [productImagesMap, setProductImagesMap] = useState<Map<string, any>>(new Map());
  const [loadingImages, setLoadingImages] = useState(false);

  const [expandedOrderDetails, setExpandedOrderDetails] = useState<Map<string, any>>(new Map());
  const [loadingOrderDetails, setLoadingOrderDetails] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (orders.length > 0) {
      setAllOrders(orders);
      setAllIncluded(included || []);
      setHasMoreOrders(orders.length === 3);
    }
  }, [orders, included]);

  useEffect(() => {
    setCurrentPage(1);
    setAllOrders([]);
    setAllIncluded([]);
    setHasMoreOrders(true);
  }, [debouncedSearchQuery, appliedStatusFilter, appliedSortBy]);

  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 100 || gestureState.vx > 0.5) {
          setDrawerVisible(false);
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (drawerVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 250,
        useNativeDriver: true,
      }).start();
      setStatusExpanded(false);
      setPaymentExpanded(false);
      setTimeExpanded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerVisible]);

  const filteredOrders = useMemo(() => {
    let filtered = [...allOrders];

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => {
        const paymentStatus = (
          (order.attributes as any)?.paymentStatus?.label || 'pending'
        ).toLowerCase();
        if (paymentFilter === 'paid') {
          return (
            paymentStatus.includes('paid') ||
            paymentStatus.includes('completed') ||
            paymentStatus.includes('authorized')
          );
        } else if (paymentFilter === 'pending') {
          return paymentStatus.includes('pending') || paymentStatus.includes('unpaid');
        } else if (paymentFilter === 'failed') {
          return (
            paymentStatus.includes('failed') ||
            paymentStatus.includes('declined') ||
            paymentStatus.includes('cancelled')
          );
        }
        return true;
      });
    }

    // Time filter (client-side)
    if (timeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.attributes.createdAt);
        const diffTime = now.getTime() - orderDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (timeFilter === '30days') return diffDays <= 30;
        if (timeFilter === '90days') return diffDays <= 90;
        if (timeFilter === 'year') {
          return orderDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    return filtered;
  }, [allOrders, paymentFilter, timeFilter]);

  // Load more orders from API
  const loadMoreOrders = async () => {
    if (loadingMore || !hasMoreOrders || !isAuthenticated) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const { getOrders } = await import('@/src/api/helpers/orders');
      const { initializeApi, setAuthTokenGetter } = await import('@/src/api/api');

      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);

      // Use the same params as initial request but with next page number
      const loadMoreParams = {
        ...apiParams,
        page: { number: nextPage, size: 3 },
      };

      const result = await getOrders(loadMoreParams);

      if (result.data.length > 0) {
        setAllOrders(prev => [...prev, ...result.data]);
        setAllIncluded(prev => [...prev, ...(result.included || [])]);
        setCurrentPage(nextPage);
        setHasMoreOrders(result.data.length === 3);
      } else {
        setHasMoreOrders(false);
      }
    } catch (_err) {
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (allOrders.length === 0 || loadingImages) return;

    const fetchProductImages = async () => {
      setLoadingImages(true);

      try {
        const productIds = new Set<string>();
        allOrders.forEach(order => {
          order.lineItems?.forEach((lineItem: any) => {
            const productId = lineItem.relationships?.product?.data?.id;
            if (productId) {
              productIds.add(productId);
            }
          });
        });

        if (productIds.size === 0) {
          setLoadingImages(false);
          return;
        }

        const fetchPromises = Array.from(productIds).map(async (productId, index) => {
          await new Promise(resolve => setTimeout(resolve, index * 100));

          try {
            const { initializeApi, setAuthTokenGetter } = await import('@/src/api/api');
            initializeApi(baseUrl);
            setAuthTokenGetter(getValidAccessToken);

            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

            const response = await fetch(
              `${cleanBaseUrl}/api/products/${productId}?include=images`,
              {
                headers: {
                  Authorization: `Bearer ${await getValidAccessToken()}`,
                  'Content-Type': 'application/vnd.api+json',
                },
              }
            );

            if (response.ok) {
              const data = await response.json();

              setProductImagesMap(prev => {
                const newMap = new Map(prev);
                if (data.included) {
                  data.included.forEach((item: any) => {
                    if (item.type === 'productimages') {
                      newMap.set(item.id, item);
                    }
                  });
                }
                if (data.data) {
                  newMap.set(`product_${productId}`, data.data);
                }
                return newMap;
              });

              if (data.included) {
                data.included.forEach((item: any) => {
                  if (item.type === 'productimages' && item.attributes?.files) {
                    const mainFile = item.attributes.files.find(
                      (file: any) =>
                        file.types?.includes('main') &&
                        (file.dimension === 'product_small' || file.dimension === 'product_medium')
                    );

                    if (mainFile?.url) {
                      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                      const cleanImageUrl = mainFile.url.startsWith('/')
                        ? mainFile.url
                        : `/${mainFile.url}`;
                      const fullUrl = `${cleanBaseUrl}${cleanImageUrl}`;

                      // Add a small delay before marking as loaded for progressive effect
                      setTimeout(() => {
                        setLoadedImages(prev => {
                          const newSet = new Set(prev);
                          newSet.add(fullUrl);
                          return newSet;
                        });
                      }, index * 50);
                    }
                  }
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching images for product ${productId}:`, err);
          }
        });

        await Promise.all(fetchPromises);
      } catch (err) {
        console.error('Error fetching product images:', err);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchProductImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOrders, baseUrl, getValidAccessToken]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreOrders(true);
    setAllOrders([]);
    setAllIncluded([]);
    setProductImagesMap(new Map());
    setLoadingImages(false);
    setLoadedImages(new Set());
    setExpandedOrderDetails(new Map());
    setLoadingOrderDetails(new Set());
    refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLoadMore = () => {
    if (hasMoreOrders && !loadingMore) {
      loadMoreOrders();
    }
  };

  const toggleOrderExpansion = (orderId: string, e?: any) => {
    if (e) {
      e.stopPropagation();
    }

    const willBeExpanded = !expandedOrders.has(orderId);

    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });

    if (willBeExpanded && !expandedOrderDetails.has(orderId) && !loadingOrderDetails.has(orderId)) {
      fetchOrderDetails(orderId);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    setLoadingOrderDetails(prev => new Set(prev).add(orderId));

    try {
      const { getOrderById } = await import('@/src/api/helpers/orders');
      const { initializeApi, setAuthTokenGetter } = await import('@/src/api/api');

      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);

      const orderDetails = await getOrderById(
        orderId,
        'lineItems,billingAddress,shippingAddress,status,internalStatus,paymentStatus'
      );

      setExpandedOrderDetails(prev => {
        const newMap = new Map(prev);
        newMap.set(orderId, orderDetails);
        return newMap;
      });
    } catch (_err) {
    } finally {
      setLoadingOrderDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const getProductImages = (order: IOrder) => {
    if (!order.lineItems || order.lineItems.length === 0) return [];

    const productsMap = new Map();
    const imagesMap = new Map(productImagesMap);

    allIncluded.forEach((item: any) => {
      if (item.type === 'products') {
        productsMap.set(item.id, item);
      } else if (item.type === 'productimages') {
        if (!imagesMap.has(item.id)) {
          imagesMap.set(item.id, item);
        }
      }
    });

    return order.lineItems.map(lineItem => {
      const productId = (lineItem as any).relationships?.product?.data?.id;
      if (!productId) {
        return {
          id: lineItem.id,
          uri: null,
          name: lineItem.attributes?.productName || 'Product',
        };
      }

      // Try to get product from included data first, then from separately fetched data
      let product = productsMap.get(productId);
      if (!product) {
        product = productImagesMap.get(`product_${productId}`);
      }

      if (!product) {
        return {
          id: lineItem.id,
          uri: null,
          name: lineItem.attributes?.productName || 'Product',
        };
      }

      const imageRefs = product.relationships?.images?.data;
      if (!imageRefs || imageRefs.length === 0) {
        return {
          id: lineItem.id,
          uri: null,
          name: lineItem.attributes?.productName || product.attributes?.name || 'Product',
        };
      }

      let mainImageData = null;
      for (const imageRef of imageRefs) {
        const imageData = imagesMap.get(imageRef.id);
        if (imageData?.attributes?.types?.includes('main')) {
          mainImageData = imageData;
          break;
        }
      }

      if (!mainImageData) {
        mainImageData = imagesMap.get(imageRefs[0].id);
      }

      if (!mainImageData) {
        return {
          id: lineItem.id,
          uri: null,
          name: lineItem.attributes?.productName || product.attributes?.name || 'Product',
        };
      }

      let imageUrl = null;

      if (mainImageData.attributes?.files && mainImageData.attributes.files.length > 0) {
        const mainFile = mainImageData.attributes.files.find(
          (file: any) =>
            file.types?.includes('main') &&
            (file.dimension === 'product_small' || file.dimension === 'product_medium')
        );

        if (mainFile) {
          imageUrl = mainFile.url;
        } else {
          const anyMainFile = mainImageData.attributes.files.find((file: any) =>
            file.types?.includes('main')
          );
          imageUrl = anyMainFile?.url || mainImageData.attributes.files[0].url;
        }
      } else if (mainImageData.attributes?.url) {
        imageUrl = mainImageData.attributes.url;
      }

      if (!imageUrl) {
        return {
          id: lineItem.id,
          uri: null,
          name: lineItem.attributes?.productName || product.attributes?.name || 'Product',
        };
      }

      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

      return {
        id: lineItem.id,
        uri: `${cleanBaseUrl}${cleanImageUrl}`,
        name: lineItem.attributes?.productName || product.attributes?.name || 'Product',
      };
    });
  };

  const isImageLoaded = (uri: string | null) => {
    if (!uri) return true;
    return loadedImages.has(uri);
  };

  const renderOrderItem = ({ item: order }: { item: IOrder }) => {
    const orderStatus = getOrderStatusText(order);
    const itemsCount = order.lineItems?.length || 0;
    const totalValue = parseFloat((order.attributes as any)?.totalValue || '0');
    const orderDate = new Date(order.attributes.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const isExpanded = expandedOrders.has(order.id);
    const detailedOrder = expandedOrderDetails.get(order.id);
    const isLoadingDetails = loadingOrderDetails.has(order.id);

    const orderToUse = detailedOrder || order;

    const paymentStatus =
      (orderToUse.attributes as any)?.paymentStatus?.label ||
      (detailedOrder ? 'Pending payment' : '...');

    const paymentMethod =
      (orderToUse.attributes as any)?.paymentMethod?.[0]?.label || (detailedOrder ? 'N/A' : '...');

    // Determine if order is shipped
    const shippingStatus =
      orderStatus.toLowerCase().includes('shipped') ||
      orderStatus.toLowerCase().includes('delivered')
        ? 'Shipped'
        : 'Not Shipped';

    const productImages = getProductImages(order);
    const imagesPerRow = 4;
    const maxRows = 2;
    const maxVisibleImages = imagesPerRow * maxRows;
    const hasMoreImages = productImages.length > maxVisibleImages;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/order/${order.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>Order #{order.attributes.identifier}</Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
          </View>
          <View style={styles.orderHeaderRight}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColorByText(orderStatus) + '20' },
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColorByText(orderStatus) }]}>
                {orderStatus}
              </Text>
            </View>
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                toggleOrderExpansion(order.id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <ChevronDown
                size={20}
                color={ShopColors.textSecondary}
                style={{
                  transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                  marginLeft: 8,
                }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {productImages.length > 0 && (
          <View style={styles.productImagesSection}>
            <View style={styles.productImagesGrid}>
              {productImages.slice(0, maxVisibleImages).map((image, index) => (
                <View key={image.id || index} style={styles.productImageWrapper}>
                  {!isImageLoaded(image.uri) ? (
                    <SkeletonImage />
                  ) : image.uri ? (
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={require('@/assets/images/no_image.png')}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
              ))}
            </View>
            {hasMoreImages && (
              <View style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>
                  +{productImages.length - maxVisibleImages} more
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.orderTotalRow}>
          <Text style={styles.orderTotalLabel}>Total:</Text>
          <Text style={styles.orderTotalValue}>
            {order.attributes.currency === 'USD'
              ? '$'
              : order.attributes.currency === 'EUR'
                ? '€'
                : '£'}
            {totalValue.toFixed(2)}
          </Text>
        </View>

        {isExpanded && (
          <>
            <View style={styles.orderDivider} />

            {isLoadingDetails ? (
              <View style={styles.orderDetails}>
                <ActivityIndicator size="small" color={ShopColors.primary} />
              </View>
            ) : (
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Items:</Text>
                  <Text style={styles.detailValue}>
                    {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment:</Text>
                  <Text
                    style={[styles.detailValue, { color: getPaymentStatusColor(paymentStatus) }]}
                  >
                    {paymentStatus}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <CreditCard size={14} color={ShopColors.textSecondary} />
                  <Text style={[styles.detailLabel, { marginLeft: 8 }]}>Payment Method:</Text>
                  <View style={styles.paymentMethodContainer}>
                    <Text style={styles.detailValue}>{paymentMethod}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Truck
                    size={14}
                    color={
                      shippingStatus === 'Shipped' ? ShopColors.success : ShopColors.textSecondary
                    }
                  />
                  <Text style={[styles.detailLabel, { marginLeft: 8 }]}>Shipping Status:</Text>
                  <View style={styles.shippingStatusContainer}>
                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color:
                            shippingStatus === 'Shipped'
                              ? ShopColors.success
                              : ShopColors.textSecondary,
                        },
                      ]}
                    >
                      {shippingStatus}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Guest View - Not Authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />

          <View style={styles.contentWrapper}>
            <ShopHeader />

            <View style={styles.guestContainer}>
              <Package size={80} color={ShopColors.textSecondary} />
              <Text style={styles.guestTitle}>Sign in to view your orders</Text>
              <Text style={styles.guestText}>
                Track your orders, view order history, and manage returns all in one place.
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/(auth)/login?redirect=orders')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />

          <View style={styles.contentWrapper}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ShopColors.primary} />
              <Text style={styles.loadingText}>Loading your orders...</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && isAuthenticated) {
    const hasFiltersInError =
      debouncedSearchQuery.trim() !== '' ||
      appliedStatusFilter !== 'all' ||
      paymentFilter !== 'all' ||
      timeFilter !== 'all' ||
      appliedSortBy !== 'date-desc';

    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />

          <View style={styles.contentWrapper}>
            <ShopHeader />

            <View style={styles.loadingContainer}>
              <Package size={48} color={ShopColors.error} />
              <Text style={[styles.loadingText, { color: ShopColors.error }]}>{error}</Text>
              <View style={styles.errorButtonsContainer}>
                <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.7}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                {hasFiltersInError && (
                  <TouchableOpacity
                    style={[styles.retryButton, styles.clearFiltersButton]}
                    onPress={() => {
                      clearAllFilters();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.retryButtonText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const hasAnyFilters =
    debouncedSearchQuery.trim() !== '' ||
    appliedStatusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    timeFilter !== 'all' ||
    appliedSortBy !== 'date-desc';

  if (orders.length === 0 && !hasAnyFilters && !loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />

          <View style={styles.contentWrapper}>
            <ShopHeader />

            <ScrollView
              contentContainerStyle={styles.emptyContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={ShopColors.primary}
                  colors={[ShopColors.primary]}
                />
              }
            >
              <Package size={80} color={ShopColors.textSecondary} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>When you place orders, they will appear here.</Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.7}
              >
                <Text style={styles.shopButtonText}>Start Shopping</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Orders List View
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Orders</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={refetch}>
              <RefreshCw size={20} color={ShopColors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchFilterRow}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={ShopColors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by order number..."
                placeholderTextColor={ShopColors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleApplySearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setDebouncedSearchQuery('');
                  }}
                >
                  <X size={18} color={ShopColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.trim() !== debouncedSearchQuery.trim() && searchQuery.trim() !== '' && (
              <TouchableOpacity
                style={styles.applySearchButton}
                onPress={handleApplySearch}
                activeOpacity={0.7}
              >
                <Text style={styles.applySearchButtonText}>Apply</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.filterButton,
                (appliedStatusFilter !== 'all' ||
                  paymentFilter !== 'all' ||
                  timeFilter !== 'all' ||
                  appliedSortBy !== 'date-desc') &&
                  styles.filterButtonActive,
              ]}
              onPress={handleOpenDrawer}
              activeOpacity={0.7}
            >
              <Filter
                size={20}
                color={
                  appliedStatusFilter !== 'all' ||
                  paymentFilter !== 'all' ||
                  timeFilter !== 'all' ||
                  appliedSortBy !== 'date-desc'
                    ? '#FFFFFF'
                    : ShopColors.primary
                }
              />
            </TouchableOpacity>
          </View>

          {(appliedStatusFilter !== 'all' || paymentFilter !== 'all' || timeFilter !== 'all') && (
            <View style={styles.chipsContainer}>
              {appliedStatusFilter !== 'all' && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{getStatusFilterLabel(appliedStatusFilter)}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setStatusFilter('all');
                      setAppliedStatusFilter('all');
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={14} color={ShopColors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {paymentFilter !== 'all' && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{getPaymentFilterLabel(paymentFilter)}</Text>
                  <TouchableOpacity
                    onPress={() => setPaymentFilter('all')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={14} color={ShopColors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {timeFilter !== 'all' && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{getTimeFilterLabel(timeFilter)}</Text>
                  <TouchableOpacity
                    onPress={() => setTimeFilter('all')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={14} color={ShopColors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Orders FlatList with Infinite Scroll */}
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={order => order.id}
            ListEmptyComponent={
              <View style={styles.noResultsContainer}>
                <Package size={60} color={ShopColors.textSecondary} />
                <Text style={styles.noResultsTitle}>No orders found</Text>
                <Text style={styles.noResultsText}>
                  Try adjusting your filters or search criteria
                </Text>
              </View>
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore || hasMoreOrders ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={ShopColors.primary} />
                  <Text style={styles.loadingMoreText}>Loading more orders...</Text>
                </View>
              ) : allOrders.length > 0 ? (
                <View style={styles.endOfList}></View>
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[ShopColors.primary]}
                tintColor={ShopColors.primary}
              />
            }
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={true}
          />
        </View>

        {/* Filter Drawer Modal */}
        <Modal
          visible={drawerVisible}
          transparent
          animationType="none"
          onRequestClose={() => setDrawerVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setDrawerVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.drawerContainer,
                    {
                      transform: [{ translateX: slideAnim }],
                    },
                  ]}
                  {...panResponder.panHandlers}
                >
                  <SafeAreaView style={styles.drawerSafeArea} edges={['top', 'bottom']}>
                    <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
                      {/* Drawer Header */}
                      <View style={styles.drawerHeader}>
                        <Text style={styles.drawerTitle}>Filters & Sort</Text>
                        <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                          <X size={24} color={ShopColors.text} />
                        </TouchableOpacity>
                      </View>

                      {/* Filters Section */}
                      <View style={styles.drawerSection}>
                        <Text style={styles.drawerSectionTitle}>FILTERS</Text>

                        {/* Order Status Filter - Select Style */}
                        <View style={styles.drawerFilterGroup}>
                          <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => setStatusExpanded(!statusExpanded)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.selectButtonContent}>
                              <Text style={styles.selectLabel}>Order Status</Text>
                              <Text style={styles.selectValue}>
                                {getStatusFilterLabel(statusFilter)}
                              </Text>
                            </View>
                            <ChevronDown
                              size={20}
                              color={ShopColors.textSecondary}
                              style={{
                                transform: [{ rotate: statusExpanded ? '180deg' : '0deg' }],
                              }}
                            />
                          </TouchableOpacity>
                          {statusExpanded && (
                            <View style={styles.selectOptions}>
                              {[
                                'all',
                                'open',
                                'processing',
                                'shipped',
                                'delivered',
                                'cancelled',
                              ].map(status => (
                                <TouchableOpacity
                                  key={status}
                                  style={styles.selectOption}
                                  onPress={() => {
                                    setStatusFilter(status);
                                    setStatusExpanded(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text
                                    style={[
                                      styles.selectOptionText,
                                      statusFilter === status && styles.selectOptionTextActive,
                                    ]}
                                  >
                                    {getStatusFilterLabel(status)}
                                  </Text>
                                  {statusFilter === status && (
                                    <Check size={18} color={ShopColors.primary} />
                                  )}
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>

                        {/* Payment Status Filter - Select Style */}
                        <View style={styles.drawerFilterGroup}>
                          <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => setPaymentExpanded(!paymentExpanded)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.selectButtonContent}>
                              <Text style={styles.selectLabel}>Payment Status</Text>
                              <Text style={styles.selectValue}>
                                {getPaymentFilterLabel(paymentFilter)}
                              </Text>
                            </View>
                            <ChevronDown
                              size={20}
                              color={ShopColors.textSecondary}
                              style={{
                                transform: [{ rotate: paymentExpanded ? '180deg' : '0deg' }],
                              }}
                            />
                          </TouchableOpacity>
                          {paymentExpanded && (
                            <View style={styles.selectOptions}>
                              {['all', 'paid', 'pending', 'failed'].map(payment => (
                                <TouchableOpacity
                                  key={payment}
                                  style={styles.selectOption}
                                  onPress={() => {
                                    setPaymentFilter(payment);
                                    setPaymentExpanded(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text
                                    style={[
                                      styles.selectOptionText,
                                      paymentFilter === payment && styles.selectOptionTextActive,
                                    ]}
                                  >
                                    {getPaymentFilterLabel(payment)}
                                  </Text>
                                  {paymentFilter === payment && (
                                    <Check size={18} color={ShopColors.primary} />
                                  )}
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>

                        {/* Time Period Filter - Select Style */}
                        <View style={styles.drawerFilterGroup}>
                          <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => setTimeExpanded(!timeExpanded)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.selectButtonContent}>
                              <Text style={styles.selectLabel}>Time Period</Text>
                              <Text style={styles.selectValue}>
                                {getTimeFilterLabel(timeFilter)}
                              </Text>
                            </View>
                            <ChevronDown
                              size={20}
                              color={ShopColors.textSecondary}
                              style={{ transform: [{ rotate: timeExpanded ? '180deg' : '0deg' }] }}
                            />
                          </TouchableOpacity>
                          {timeExpanded && (
                            <View style={styles.selectOptions}>
                              {[
                                { value: 'all', label: 'All Time' },
                                { value: '30days', label: 'Last 30 Days' },
                                { value: '90days', label: 'Last 90 Days' },
                                { value: 'year', label: 'This Year' },
                              ].map(time => (
                                <TouchableOpacity
                                  key={time.value}
                                  style={styles.selectOption}
                                  onPress={() => {
                                    setTimeFilter(time.value);
                                    setTimeExpanded(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text
                                    style={[
                                      styles.selectOptionText,
                                      timeFilter === time.value && styles.selectOptionTextActive,
                                    ]}
                                  >
                                    {time.label}
                                  </Text>
                                  {timeFilter === time.value && (
                                    <Check size={18} color={ShopColors.primary} />
                                  )}
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Sort Section */}
                      <View style={styles.drawerSection}>
                        <Text style={styles.drawerSectionTitle}>SORT BY</Text>

                        <View style={styles.drawerFilterGroup}>
                          {[
                            { value: 'date-desc', label: 'Newest First' },
                            { value: 'date-asc', label: 'Oldest First' },
                            { value: 'id-desc', label: 'Order ID: High to Low' },
                            { value: 'id-asc', label: 'Order ID: Low to High' },
                          ].map(sort => (
                            <TouchableOpacity
                              key={sort.value}
                              style={styles.drawerOption}
                              onPress={() => setSortBy(sort.value as any)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.radioButton}>
                                <View
                                  style={[
                                    styles.radioButtonOuter,
                                    sortBy === sort.value && styles.radioButtonOuterActive,
                                  ]}
                                >
                                  {sortBy === sort.value && (
                                    <View style={styles.radioButtonInner} />
                                  )}
                                </View>
                                <Text
                                  style={[
                                    styles.drawerOptionText,
                                    sortBy === sort.value && styles.drawerOptionTextActive,
                                  ]}
                                >
                                  {sort.label}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Clear and Apply Buttons */}
                      <View style={styles.drawerFooter}>
                        {(statusFilter !== 'all' ||
                          paymentFilter !== 'all' ||
                          timeFilter !== 'all' ||
                          sortBy !== 'date-desc') && (
                          <TouchableOpacity
                            style={styles.clearButton}
                            onPress={clearAllFilters}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.clearButtonText}>Clear All</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.applyButton}
                          onPress={() => {
                            handleApplyFilters();
                            setDrawerVisible(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.applyButtonText}>Apply</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </SafeAreaView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  contentWrapper: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ShopColors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestText: {
    fontSize: 16,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
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
  retryButton: {
    marginTop: 20,
    backgroundColor: ShopColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearFiltersButton: {
    backgroundColor: ShopColors.textSecondary,
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
  shopButton: {
    backgroundColor: ShopColors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ordersContainer: {
    padding: 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ShopColors.text,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ShopColors.background,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: ShopColors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  orderTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: ShopColors.textSecondary,
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  orderDivider: {
    height: 1,
    backgroundColor: ShopColors.border,
    marginVertical: 12,
  },
  // Product Images Section
  productImagesSection: {
    marginVertical: 12,
  },
  productImagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 12,
  },
  productImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productImageWrapper: {
    width: Dimensions.get('window').width < 425 ? 70 : 80,
    height: Dimensions.get('window').width < 425 ? 70 : 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: ShopColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  productImagePlaceholderText: {
    fontSize: 10,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    textAlign: 'center',
  },
  skeletonImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    position: 'relative',
    overflow: 'hidden',
  },
  skeletonShimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: ShopColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ShopColors.border,
    gap: 6,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  orderDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: ShopColors.text,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  shippingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  paymentStatus: {
    color: ShopColors.text,
  },
  shippingStatus: {
    color: ShopColors.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItems: {
    fontSize: 14,
    color: ShopColors.textSecondary,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  // Search and Filter Row styles
  searchFilterRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: ShopColors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: ShopColors.text,
    paddingVertical: 0,
  },
  applySearchButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: ShopColors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applySearchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  filterButtonActive: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  // Active Filter Chips styles
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ShopColors.primary + '15',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: ShopColors.primary + '30',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  // Drawer Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  drawerContainer: {
    width: '80%',
    maxWidth: 400,
    height: '100%',
    backgroundColor: ShopColors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerSafeArea: {
    flex: 1,
  },
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
  },
  drawerSection: {
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  drawerSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ShopColors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  drawerFilterGroup: {
    marginBottom: 20,
  },
  // Select-style button
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: ShopColors.background,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  selectButtonContent: {
    flex: 1,
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    marginBottom: 4,
  },
  selectValue: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.text,
  },
  selectOptions: {
    backgroundColor: ShopColors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ShopColors.border,
    overflow: 'hidden',
  },
  selectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  selectOptionText: {
    fontSize: 15,
    color: ShopColors.text,
    fontWeight: '400',
  },
  selectOptionTextActive: {
    fontWeight: '600',
    color: ShopColors.primary,
  },
  drawerFilterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  drawerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  drawerOptionText: {
    fontSize: 15,
    color: ShopColors.text,
    fontWeight: '400',
  },
  drawerOptionTextActive: {
    fontWeight: '600',
    color: ShopColors.primary,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioButtonOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ShopColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonOuterActive: {
    borderColor: ShopColors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ShopColors.primary,
  },
  drawerFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
    backgroundColor: ShopColors.background,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: ShopColors.cardBackground,
    borderWidth: 1,
    borderColor: ShopColors.border,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: ShopColors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    marginTop: 8,
  },
  endOfList: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    fontStyle: 'italic',
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
