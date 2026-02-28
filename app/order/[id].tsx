import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, CreditCard, Truck, ShoppingCart } from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import { getOrderById, IOrder } from '@/src/api/helpers/orders';
import { formatPrice } from '@/src/utils/priceFormatter';
import { MainMenu } from '@/src/components/MainMenu';
import { ThemeColors } from '@/src/themes/types';

export default function OrderViewScreen() {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { baseUrl } = useConfig();
  const { getValidAccessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<IOrder | null>(null);
  const [products, setProducts] = useState<Map<string, any>>(new Map());
  const [images, setImages] = useState<Map<string, any>>(new Map());
  const [inventoryStatuses, setInventoryStatuses] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    const loadOrder = async () => {
      if (!id || !baseUrl) return;

      try {
        setLoading(true);
        initializeApi(baseUrl);
        setAuthTokenGetter(getValidAccessToken);

        const orderResult = await getOrderById(id);
        if (orderResult) {
          setOrder(orderResult);

          const included = (orderResult as any).included || [];

          const productsMap = new Map();
          const imagesMap = new Map();
          const inventoryStatusMap = new Map();

          included.forEach((item: any) => {
            if (item.type === 'products') {
              productsMap.set(item.id, item);
            } else if (item.type === 'productimages') {
              imagesMap.set(item.id, item);
            } else if (item.type === 'inventorystatuses' || item.type === 'inventorystatus') {
              inventoryStatusMap.set(item.id, item);
            }
          });

          setProducts(productsMap);
          setImages(imagesMap);
          setInventoryStatuses(inventoryStatusMap);
        }

        setLoading(false);
      } catch (_err: any) {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, baseUrl, getValidAccessToken]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (value?: string, _currency: string = 'USD') => {
    if (!value) return '$0.00';
    return `$${formatPrice(value)}`;
  };

  const getStatusText = (): string => {
    if (!order) return 'Open';

    // Try to get from included data first
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

    // Try to get from attributes
    const status = order!.attributes?.status || (order!.attributes as any)?.internalStatus;
    if (!status) return 'Open';
    if (typeof status === 'string') return status;
    if (typeof status === 'object' && status.label) return String(status.label);
    if (typeof status === 'object' && status.name) return String(status.name);
    return 'Open';
  };

  const getShippingMethodText = (method?: any): string => {
    if (!method) return 'N/A';
    if (typeof method === 'string') return method;
    if (typeof method === 'object' && method.label) return String(method.label);
    if (typeof method === 'object' && method.name) return String(method.name);
    return 'N/A';
  };

  const getProductImage = (lineItem: any): string | null => {
    if (!baseUrl) return null;

    // Get product from line item relationships
    const productId = lineItem.relationships?.product?.data?.id;
    if (!productId) return null;

    const product = products.get(productId);
    if (!product) return null;

    const imageRefs = product.relationships?.images?.data;
    if (!imageRefs || imageRefs.length === 0) return null;

    // Find the image with "main" type
    let mainImageData = null;
    for (const imageRef of imageRefs) {
      const imageData = images.get(imageRef.id);
      if (imageData?.attributes?.types?.includes('main')) {
        mainImageData = imageData;
        break;
      }
    }

    // Fallback to first image if no main image found
    if (!mainImageData) {
      mainImageData = images.get(imageRefs[0].id);
    }

    if (!mainImageData) return null;

    let imageUrl = null;

    // Extract image URL from files array
    if (mainImageData.attributes?.files && mainImageData.attributes.files.length > 0) {
      const mainFile = mainImageData.attributes.files.find(
        (file: any) =>
          file.types?.includes('main') &&
          (file.dimension === 'product_small' || file.dimension === 'product_medium')
      );

      if (mainFile) {
        imageUrl = mainFile.url;
      } else {
        // Fallback to first file with main type
        const anyMainFile = mainImageData.attributes.files.find((file: any) =>
          file.types?.includes('main')
        );
        imageUrl = anyMainFile?.url || mainImageData.attributes.files[0].url;
      }
    } else if (mainImageData.attributes?.url) {
      imageUrl = mainImageData.attributes.url;
    }

    if (!imageUrl) return null;

    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${cleanBaseUrl}${cleanImageUrl}`;
  };

  const getInventoryStatus = (lineItem: any): string | null => {
    const productId = lineItem.relationships?.product?.data?.id;
    if (!productId) return null;

    const product = products.get(productId);
    if (!product) return null;

    const statusId = product.relationships?.inventoryStatus?.data?.id;
    if (statusId) {
      const status = inventoryStatuses.get(statusId);
      if (status?.attributes?.name) {
        return status.attributes.name;
      }
    }

    if (product.attributes?.inventory_status) {
      return product.attributes.inventory_status;
    }

    return null;
  };

  const getInventoryDotColor = (status?: string | null): string => {
    if (!status) return ShopColors.textSecondary;

    const statusLower = status.toLowerCase();
    if (statusLower.includes('in stock') || statusLower.includes('available')) {
      return ShopColors.success;
    } else if (statusLower.includes('out of stock') || statusLower.includes('unavailable')) {
      return ShopColors.error;
    } else if (statusLower.includes('discontinued')) {
      return ShopColors.warning;
    } else if (statusLower.includes('low stock') || statusLower.includes('limited')) {
      return ShopColors.warning;
    }
    return ShopColors.textSecondary;
  };

  const getStatusBadgeStyle = (_status?: string) => {
    return styles.statusBadge;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ShopColors.primary} />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalItems =
    order.lineItems?.reduce((sum, item) => sum + (item.attributes?.quantity || 0), 0) || 0;
  const subtotal = parseFloat((order.attributes as any)?.subtotalValue || '0');
  const total = parseFloat((order.attributes as any)?.totalValue || '0');
  const shipping = parseFloat((order.attributes as any)?.shippingCostAmount || '0');
  const tax = parseFloat((order.attributes as any)?.totalTaxAmount || '0');

  // Extract discounts
  const discounts = (order.attributes as any)?.discounts || [];
  const productDiscount = discounts.find((d: any) => d.type !== 'promotion.shipping');
  const shippingDiscount = discounts.find((d: any) => d.type === 'promotion.shipping');

  const productDiscountAmount = productDiscount ? parseFloat(productDiscount.amount || '0') : 0;
  const shippingDiscountAmount = shippingDiscount ? parseFloat(shippingDiscount.amount || '0') : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/orders')}>
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Order #{order.attributes.identifier}</Text>
            <Text style={styles.headerSubtitle}>{formatDate(order.attributes.createdAt)}</Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Order Status */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Status</Text>
              <View style={getStatusBadgeStyle(getStatusText())}>
                <Text style={styles.statusText}>{getStatusText()}</Text>
              </View>
            </View>

            {/* Order Details */}
            <View style={styles.orderDetailsContainer}>
              <View style={styles.orderDetailRow}>
                <Text style={styles.orderDetailLabel}>PO Number:</Text>
                <Text style={styles.orderDetailValue}>
                  {(order.attributes as any)?.poNumber || 'N/A'}
                </Text>
              </View>

              {(order.attributes as any)?.customerNotes && (
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Customer Notes:</Text>
                  <Text style={styles.orderDetailValue}>
                    {(order.attributes as any)?.customerNotes}
                  </Text>
                </View>
              )}

              <View style={styles.orderDetailRow}>
                <Text style={styles.orderDetailLabel}>Ship Until:</Text>
                <Text style={styles.orderDetailValue}>
                  {(order.attributes as any)?.shipUntil
                    ? formatDate((order.attributes as any)?.shipUntil)
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Addresses Row */}
          <View style={styles.twoColumnRow}>
            {/* Shipping Address */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MapPin size={20} color={ShopColors.primary} />
                <Text style={styles.cardTitle}>Shipping Address</Text>
              </View>
              {order.shippingAddress?.attributes ? (
                <View style={styles.cardContent}>
                  {order.shippingAddress.attributes.organization && (
                    <Text style={styles.addressText}>
                      {order.shippingAddress.attributes.organization}
                    </Text>
                  )}
                  <Text style={styles.addressText}>
                    {order.shippingAddress.attributes.firstName}{' '}
                    {order.shippingAddress.attributes.lastName}
                  </Text>
                  {order.shippingAddress.attributes.street && (
                    <Text style={styles.addressText}>
                      {order.shippingAddress.attributes.street}
                    </Text>
                  )}
                  {order.shippingAddress.attributes.street2 && (
                    <Text style={styles.addressText}>
                      {order.shippingAddress.attributes.street2}
                    </Text>
                  )}
                  <Text style={styles.addressText}>
                    {order.shippingAddress.attributes.city}{' '}
                    {order.shippingAddress.attributes.postalCode}
                  </Text>
                  {order.shippingAddress.attributes.phone && (
                    <Text style={styles.addressText}>{order.shippingAddress.attributes.phone}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.noDataText}>No shipping address</Text>
              )}
            </View>

            {/* Billing Address */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <CreditCard size={20} color={ShopColors.primary} />
                <Text style={styles.cardTitle}>Billing Address</Text>
              </View>
              {order.billingAddress?.attributes ? (
                <View style={styles.cardContent}>
                  {order.billingAddress.attributes.label && (
                    <Text style={styles.addressLabel}>{order.billingAddress.attributes.label}</Text>
                  )}
                  <Text style={styles.addressText}>
                    {order.billingAddress.attributes.firstName}{' '}
                    {order.billingAddress.attributes.lastName}
                  </Text>
                  {order.billingAddress.attributes.street && (
                    <Text style={styles.addressText}>{order.billingAddress.attributes.street}</Text>
                  )}
                  {order.billingAddress.attributes.street2 && (
                    <Text style={styles.addressText}>
                      {order.billingAddress.attributes.street2}
                    </Text>
                  )}
                  <Text style={styles.addressText}>
                    {order.billingAddress.attributes.city}{' '}
                    {order.billingAddress.attributes.postalCode}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noDataText}>No billing address</Text>
              )}
            </View>
          </View>

          {/* Shipping & Payment Info Row */}
          <View style={styles.twoColumnRow}>
            {/* Shipping Method */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Truck size={20} color={ShopColors.primary} />
                <Text style={styles.cardTitle}>Shipping Method</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.infoText}>
                  {getShippingMethodText(order.attributes?.shippingMethod)}
                </Text>
                <Text style={styles.infoLabel}>Shipping Status</Text>
                <Text style={styles.infoText}>Not Shipped</Text>
                <Text style={styles.infoLabel}>Tracking Numbers</Text>
                <Text style={styles.infoText}>N/A</Text>
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <CreditCard size={20} color={ShopColors.primary} />
                <Text style={styles.cardTitle}>Payment Method</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.infoText}>
                  {(order.attributes as any)?.paymentMethod?.[0]?.label || 'Payment Term'}
                </Text>
                {(order.attributes as any)?.paymentTerm && (
                  <>
                    <Text style={styles.infoLabel}>Payment Term</Text>
                    <Text style={styles.infoText}>{(order.attributes as any)?.paymentTerm}</Text>
                  </>
                )}
                <Text style={styles.infoLabel}>Payment Status</Text>
                <Text style={styles.infoText}>
                  {(order.attributes as any)?.paymentStatus?.label || 'Pending payment'}
                </Text>
              </View>
            </View>
          </View>

          {/* Line Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items Ordered</Text>
              <Text style={styles.itemCount}>
                {totalItems} {totalItems === 1 ? 'product' : 'products'}
              </Text>
            </View>

            <View style={styles.lineItemsContainer}>
              {order.lineItems && order.lineItems.length > 0 ? (
                order.lineItems.map((item, index) => {
                  const imageUrl = getProductImage(item);
                  const inventoryStatus = getInventoryStatus(item);
                  const productUnit = (item.attributes as any)?.productUnitCode || 'items';

                  return (
                    <View key={item.id} style={styles.lineItem}>
                      <View style={styles.lineItemMain}>
                        {/* Product Image */}
                        <View style={styles.lineItemImageContainer}>
                          {imageUrl ? (
                            <Image
                              source={{ uri: imageUrl }}
                              style={styles.lineItemImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.lineItemImagePlaceholder}>
                              <ShoppingCart size={32} color={ShopColors.primary} />
                            </View>
                          )}
                        </View>

                        <View style={styles.lineItemInfo}>
                          <TouchableOpacity
                            onPress={() => {
                              const productId = (item.relationships as any)?.product?.data?.id;
                              if (productId) {
                                router.push(`/product/${productId}` as any);
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.productName} numberOfLines={2}>
                              {item.attributes?.productName || 'Unknown Product'}
                            </Text>
                          </TouchableOpacity>

                          {/* SKU and Inventory Status */}
                          <View style={styles.skuRow}>
                            {inventoryStatus && (
                              <View style={styles.inventoryDotContainer}>
                                <View
                                  style={[
                                    styles.inventoryDot,
                                    { backgroundColor: getInventoryDotColor(inventoryStatus) },
                                  ]}
                                />
                              </View>
                            )}
                            <Text style={styles.productSku}>
                              SKU: {item.attributes?.productSku}
                            </Text>
                          </View>

                          <View style={styles.quantityRow}>
                            <Text style={styles.quantityText}>
                              Quantity: {item.attributes?.quantity} {productUnit}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.lineItemPrice}>
                          <Text style={styles.priceText}>
                            {formatCurrency(
                              (item.attributes as any)?.rowTotalAfterDiscount ||
                                item.attributes?.price,
                              order.attributes.currency
                            )}
                          </Text>
                          {item.attributes?.price && (
                            <Text style={styles.unitPrice}>
                              {formatCurrency(item.attributes.price, order.attributes.currency)} /{' '}
                              {productUnit}
                            </Text>
                          )}
                        </View>
                      </View>
                      {index < order.lineItems!.length - 1 && (
                        <View style={styles.lineItemDivider} />
                      )}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noDataText}>No items in this order</Text>
              )}
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(subtotal.toString(), order.attributes.currency)}
              </Text>
            </View>

            {productDiscountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatCurrency(productDiscountAmount.toString(), order.attributes.currency)}
                </Text>
              </View>
            )}

            {shipping > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(shipping.toString(), order.attributes.currency)}
                </Text>
              </View>
            )}

            {shippingDiscountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping Discount</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatCurrency(shippingDiscountAmount.toString(), order.attributes.currency)}
                </Text>
              </View>
            )}

            {tax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(tax.toString(), order.attributes.currency)}
                </Text>
              </View>
            )}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                {formatCurrency(total.toString(), order.attributes.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Main Menu Footer */}
      <MainMenu activeTab="/(tabs)/orders" />
    </SafeAreaView>
  );
}

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: ShopColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ShopColors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: ShopColors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: ShopColors.error,
    marginBottom: 16,
  },
  button: {
    backgroundColor: ShopColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: ShopColors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  // Order Details
  orderDetailsContainer: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
    gap: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    flex: 1,
  },
  orderDetailValue: {
    fontSize: 14,
    color: ShopColors.text,
    flex: 2,
    textAlign: 'right',
  },
  // Status Badge
  statusBadge: {
    backgroundColor: ShopColors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  // Two Column Row
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  // Card
  card: {
    flex: 1,
    minWidth: 160,
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
  },
  cardContent: {
    gap: 4,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ShopColors.primary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: ShopColors.text,
    lineHeight: 20,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: ShopColors.text,
  },
  noDataText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    fontStyle: 'italic',
  },
  // Line Items
  lineItemsContainer: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.border,
    overflow: 'hidden',
  },
  lineItem: {
    backgroundColor: ShopColors.cardBackground,
  },
  lineItemMain: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  lineItemImageContainer: {
    marginRight: 12,
  },
  lineItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  lineItemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: ShopColors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineItemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inventoryDotContainer: {
    marginRight: 8,
  },
  inventoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ShopColors.textSecondary,
  },
  productSku: {
    fontSize: 13,
    color: ShopColors.textSecondary,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  lineItemPrice: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  unitPrice: {
    fontSize: 12,
    color: ShopColors.textSecondary,
    marginTop: 4,
  },
  lineItemDivider: {
    height: 1,
    backgroundColor: ShopColors.border,
    marginLeft: 108,
  },
  // Summary
  summaryCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: ShopColors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: ShopColors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    color: ShopColors.text,
    fontWeight: '600',
  },
  discountValue: {
    color: ShopColors.success,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: ShopColors.border,
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 18,
    color: ShopColors.text,
    fontWeight: '700',
  },
  summaryTotalValue: {
    fontSize: 22,
    color: ShopColors.primary,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 32,
  },
});
