import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  Share,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Search,
  Share2,
} from '@/src/libs/Icon';
import { HtmlRenderer } from '@/src/components/HtmlRenderer';
import { useShop } from '@/src/context/ShopContext';
import { TierPricesTable } from '@/src/components/TierPricesTable';
import { TopMainMenu } from '@/src/components/TopMainMenu';
import { showToast } from '@/src/utils/toast';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { IProduct } from '@/src/api/helpers/products';
import api, { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import { PRODUCTS_ENDPOINT } from '@/src/api/endpoints';
import { IJsonApiResponse } from '@/src/api/types';
import { addRecentlyViewed } from '@/src/api/hooks/useRecentlyViewed';
import { ThemeColors } from '@/src/themes/types';

export default function ProductDetailScreen() {
  const { colors: ShopColors, effectiveConfig } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const { id, redirect } = useLocalSearchParams<{ id: string; redirect?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { toggleWishlist, isInWishlist } = useShop();
  const { baseUrl } = useConfig();
  const { getValidAccessToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [showTierPrices, setShowTierPrices] = useState(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [unitPrecisions, setUnitPrecisions] = useState<Map<string, number>>(new Map());
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      if (!baseUrl) {
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        initializeApi(baseUrl);
        setAuthTokenGetter(getValidAccessToken);

        const response = await api.get<IJsonApiResponse<IProduct>>(
          `${PRODUCTS_ENDPOINT}/${id}?include=images,inventoryStatus,prices,unitPrecisions`
        );

        const dataItem = Array.isArray(response.data.data)
          ? response.data.data[0]
          : response.data.data;

        const productData: IProduct = {
          id: dataItem.id,
          type: dataItem.type,
          attributes: dataItem.attributes as any,
          relationships: dataItem.relationships,
        };

        if (response.data.included) {
          // Parse images
          productData.images = response.data.included.filter(
            (item: any) => item.type === 'productimages'
          ) as any;

          // Parse inventory status
          const inventoryStatusItem = response.data.included.find(
            (item: any) => item.type === 'productinventorystatuses'
          );

          if (inventoryStatusItem) {
            productData.attributes.inventory_status =
              inventoryStatusItem.attributes?.name ||
              inventoryStatusItem.attributes?.label ||
              inventoryStatusItem.id;
          } else {
            console.log('No inventory status in included data');
          }

          // Parse unit precisions
          const unitPrecisionsMap = new Map<string, number>();
          const unitPrecisionItems = response.data.included.filter(
            (item: any) => item.type === 'productunitprecisions'
          );

          unitPrecisionItems.forEach((item: any) => {
            // Try multiple possible structures
            const unitCode =
              item.attributes?.unit?.code ||
              item.attributes?.unit ||
              item.attributes?.productUnit ||
              item.id;

            const precision = item.attributes?.precision ?? 0;

            if (unitCode) {
              unitPrecisionsMap.set(unitCode, precision);
            } else {
              console.log('Could not extract unit code from item:', item);
            }
          });

          if (unitPrecisionsMap.size === 0 && productData.attributes?.unitPrecisions) {
            const attrPrecisions = productData.attributes.unitPrecisions;
            if (Array.isArray(attrPrecisions)) {
              attrPrecisions.forEach((up: any) => {
                const unitCode = up.unit || up.code;
                const precision = up.precision ?? 0;
                if (unitCode) {
                  unitPrecisionsMap.set(unitCode, precision);
                }
              });
            }
          }

          setUnitPrecisions(unitPrecisionsMap);
        }

        setProduct(productData);
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, baseUrl, getValidAccessToken]);

  const availableUnits = useMemo(() => {
    if (!product) {
      return [{ code: 'item', label: 'Item' }];
    }

    if (product.attributes.unitPrecisions && Array.isArray(product.attributes.unitPrecisions)) {
      return product.attributes.unitPrecisions.map((up: any) => ({
        code: up.unit,
        label: up.unit.charAt(0).toUpperCase() + up.unit.slice(1),
        isDefault: up.default || false,
        conversionRate: up.conversionRate || 1,
        precision: up.precision ?? 0,
      }));
    }

    if (product.attributes.prices && product.attributes.prices.length > 0) {
      const unitsMap = new Map<string, string>();
      product.attributes.prices.forEach((price: any) => {
        const unitCode = price.unit || 'item';
        if (!unitsMap.has(unitCode)) {
          unitsMap.set(unitCode, unitCode);
        }
      });

      return Array.from(unitsMap.entries()).map(([code, label]) => ({
        code,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      }));
    }
    return [{ code: 'item', label: 'Item' }];
  }, [product]);

  useEffect(() => {
    if (!selectedUnit && availableUnits.length > 0) {
      const defaultUnit = availableUnits.find((u: any) => u.isDefault);
      setSelectedUnit(defaultUnit ? defaultUnit.code : availableUnits[0].code);
    }
  }, [availableUnits, selectedUnit]);

  useEffect(() => {
    if (selectedUnit && availableUnits.length > 0) {
      const isValidUnit = availableUnits.some((u: any) => u.code === selectedUnit);
      if (!isValidUnit) {
        const defaultUnit = availableUnits.find((u: any) => u.isDefault);
        setSelectedUnit(defaultUnit ? defaultUnit.code : availableUnits[0].code);
      }
    }
  }, [availableUnits, selectedUnit]);

  useEffect(() => {
    if (product && unitPrecisions.size === 0 && availableUnits.length > 0) {
      const defaultPrecisions = new Map<string, number>();
      availableUnits.forEach(unit => {
        defaultPrecisions.set(unit.code, 0);
      });
      setUnitPrecisions(defaultPrecisions);
    }
  }, [product, unitPrecisions.size, availableUnits]);

  useEffect(() => {
    if (product?.id && product?.attributes?.sku) {
      addRecentlyViewed(product.id, product.attributes.sku);
    }
  }, [product?.id, product?.attributes?.sku]);

  const handleBack = () => {
    if (redirect) {
      router.push({ pathname: redirect as string } as any);
      return;
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push('/(tabs)');
    }
  };

  const handleQuantityInputChange = (text: string) => {
    const currentPrecision = unitPrecisions.get(currentUnit) ?? 0;

    if (currentPrecision === 0) {
      const numericValue = text.replace(/[^0-9]/g, '');
      setQuantityInput(numericValue);
    } else {
      let numericValue = text.replace(/[^0-9.]/g, '');

      const parts = numericValue.split('.');
      if (parts.length > 2) {
        numericValue = parts[0] + '.' + parts.slice(1).join('');
      }

      if (parts.length === 2 && parts[1].length > currentPrecision) {
        numericValue = parts[0] + '.' + parts[1].substring(0, currentPrecision);
      }

      setQuantityInput(numericValue);
    }
  };

  const handleQuantityInputBlur = () => {
    const currentPrecision = unitPrecisions.get(currentUnit) ?? 0;
    const parsedQuantity = parseFloat(quantityInput);

    if (parsedQuantity && parsedQuantity > 0) {
      // Round to precision
      const rounded =
        currentPrecision === 0
          ? Math.round(parsedQuantity)
          : Math.round(parsedQuantity * Math.pow(10, currentPrecision)) /
            Math.pow(10, currentPrecision);
      setQuantity(rounded);
      setQuantityInput(rounded.toString());
    } else {
      setQuantityInput(quantity.toString());
    }
    setIsEditingQuantity(false);
  };

  const handleQuantityInputFocus = () => {
    setIsEditingQuantity(true);
    setQuantityInput(quantity.toString());
  };

  const handleIncreaseQuantity = () => {
    const currentPrecision = unitPrecisions.get(currentUnit) ?? 0;
    const increment = currentPrecision === 0 ? 1 : 1 / Math.pow(10, currentPrecision);
    const newQty = quantity + increment;
    const rounded =
      currentPrecision === 0
        ? Math.round(newQty)
        : Math.round(newQty * Math.pow(10, currentPrecision)) / Math.pow(10, currentPrecision);
    setQuantity(rounded);
    setQuantityInput(rounded.toString());
  };

  const handleDecreaseQuantity = () => {
    const currentPrecision = unitPrecisions.get(currentUnit) ?? 0;
    const increment = currentPrecision === 0 ? 1 : 1 / Math.pow(10, currentPrecision);
    const newQty = Math.max(increment, quantity - increment);
    const rounded =
      currentPrecision === 0
        ? Math.round(newQty)
        : Math.round(newQty * Math.pow(10, currentPrecision)) / Math.pow(10, currentPrecision);
    setQuantity(rounded);
    setQuantityInput(rounded.toString());
  };

  const handleSearchPress = () => {
    router.push('/(tabs)/search');
  };

  const handleShare = async () => {
    try {
      const productUrl = Platform.OS === 'web' ? window.location.href : `${baseUrl}product/${id}`;

      const message = `Check out ${productName}!\n${productUrl}`;

      // Web platform with Web Share API support
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: productName,
            text: `Check out ${productName}!`,
            url: productUrl,
          });
          return;
        } catch (error: any) {
          if (error.name === 'AbortError') {
            return;
          }
        }
      }

      if (Platform.OS === 'web') {
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(productUrl);
            showToast('Product link copied to clipboard!', 'success');
          } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = productUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Product link copied to clipboard!', 'success');
          }
          return;
        } catch (_error) {
          showToast('Failed to copy link', 'error');
          return;
        }
      }

      await Share.share({
        message,
        title: productName,
        url: productUrl,
      });
    } catch (_error: any) {
      showToast('Failed to share product', 'error');
    }
  };

  const handleAddToShoppingList = () => {
    if (!product) return;

    // Get product image URL
    let productImage = null;
    if (product.images && product.images.length > 0) {
      const image = product.images[selectedImageIndex];
      const files = image.attributes.files;
      const selectedFile = files.find((f: any) => f.dimension === 'product_large') || files[0];

      if (selectedFile) {
        const imageUrl = selectedFile.url_webp || selectedFile.url;
        if (imageUrl.startsWith('/')) {
          productImage = `${baseUrl.replace(/\/$/, '')}${imageUrl}`;
        } else {
          productImage = imageUrl;
        }
      }
    }

    router.push({
      pathname: '/shopping-list/add-to-list',
      params: {
        productId: product.id,
        productName: productName,
        productSku: productSku,
        productImage: productImage || '',
        unit:
          selectedUnit ||
          (availableUnits.length > 0
            ? availableUnits.find((u: any) => u.isDefault)?.code || availableUnits[0].code
            : 'item'),
        quantity: quantity.toString(),
        referrer: `/product/${product.id}`,
      },
    } as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Product Details</Text>
          <View style={styles.headerRightActions}>
            <View style={styles.headerActionButton} />
            <View style={styles.headerActionButton} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ShopColors.primary} />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Product Details</Text>
          <View style={styles.headerRightActions}>
            <View style={styles.headerActionButton} />
            <View style={styles.headerActionButton} />
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const productName = product.attributes.name || 'Unnamed Product';
  const productSku = product.attributes.sku || '';
  const productBrand =
    (product.attributes as any)?.brand?.name || (product.attributes as any)?.brand || '';
  const productDescription =
    product.attributes.description ||
    product.attributes.shortDescription ||
    'No description available';
  const isFeatured = (product.attributes as any)?.featured === true;
  const isNewArrival = (product.attributes as any)?.newArrival === true;

  const getInventoryStatusColor = (status?: string): string => {
    if (!status) return ShopColors.textSecondary;

    const statusLower = status.toLowerCase();
    if (statusLower.includes('in stock') || statusLower.includes('available')) {
      return ShopColors.success; // Green
    } else if (statusLower.includes('out of stock') || statusLower.includes('unavailable')) {
      return ShopColors.error; // Red
    } else if (statusLower.includes('discontinued')) {
      return ShopColors.warning; // Orange
    } else if (statusLower.includes('low stock') || statusLower.includes('limited')) {
      return ShopColors.warning; // Orange
    }
    return ShopColors.textSecondary; // Default gray
  };

  const getPriceForQuantity = (
    qty: number,
    unit: string
  ): { price: number; currencySymbol: string; priceAvailable: boolean } => {
    let price = 0;
    let currencySymbol = '$';
    let priceAvailable = false;

    if (product.attributes.prices && product.attributes.prices.length > 0) {
      const unitPrices = product.attributes.prices
        .filter((p: any) => (p.unit || 'item') === unit)
        .sort((a: any, b: any) => parseFloat(b.quantity) - parseFloat(a.quantity));

      if (unitPrices.length > 0) {
        const applicablePrice =
          unitPrices.find((p: any) => qty >= parseFloat(p.quantity)) ||
          unitPrices[unitPrices.length - 1];
        price = parseFloat(applicablePrice.price);
        currencySymbol =
          applicablePrice.currencyId === 'EUR'
            ? '€'
            : applicablePrice.currencyId === 'GBP'
              ? '£'
              : '$';
        priceAvailable = true;
      }
    } else if (product.attributes.price) {
      price = product.attributes.price;
      currencySymbol =
        product.attributes.currency === 'EUR'
          ? '€'
          : product.attributes.currency === 'GBP'
            ? '£'
            : '$';
      priceAvailable = true;
    }

    return { price, currencySymbol, priceAvailable };
  };

  const currentUnit =
    selectedUnit ||
    (availableUnits.length > 0
      ? availableUnits.find((u: any) => u.isDefault)?.code || availableUnits[0].code
      : 'item');
  const {
    price: productPrice,
    currencySymbol,
    priceAvailable,
  } = getPriceForQuantity(quantity, currentUnit);
  const priceUnit = currentUnit;

  const productImages: string[] = [];
  if (product.images && product.images.length > 0) {
    product.images.forEach(image => {
      const files = image.attributes.files;
      const largeImage = files.find(f => f.dimension === 'product_large');
      const mediumImage = files.find(f => f.dimension === 'product_medium');
      const extraLargeImage = files.find(f => f.dimension === 'product_extra_large');
      const selectedFile = extraLargeImage || largeImage || mediumImage || files[0];

      if (selectedFile) {
        const imageUrl = selectedFile.url_webp || selectedFile.url;
        if (imageUrl.startsWith('/')) {
          productImages.push(`${baseUrl.replace(/\/$/, '')}${imageUrl}`);
        } else {
          productImages.push(imageUrl);
        }
      }
    });
  }

  const displayImage = productImages.length > 0 ? productImages[selectedImageIndex] : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.contentWrapper}>
        {/* Page Header with Back Button */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Product Details</Text>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={handleSearchPress}
              style={styles.headerActionButton}
              activeOpacity={0.7}
            >
              <Search size={24} color={ShopColors.text} />
            </TouchableOpacity>
            <TopMainMenu />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image */}
          <View style={styles.imageSection}>
            <View style={styles.imageWrapper}>
              <Image
                source={
                  displayImage ? { uri: displayImage } : require('@/assets/images/no_image.png')
                }
                style={styles.mainImage}
                resizeMode="contain"
              />

              {/* FEATURED Badge - Top Right */}
              {isFeatured && (
                <View style={styles.badgeFeatured}>
                  <Text style={styles.badgeText}>FEATURED</Text>
                </View>
              )}

              {/* NEW Badge - Below FEATURED */}
              {isNewArrival && (
                <View style={styles.badgeNew}>
                  <Text style={styles.badgeText}>NEW</Text>
                </View>
              )}
            </View>

            {/* Image Thumbnails */}
            {productImages.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailScroll}
                contentContainerStyle={styles.thumbnailContainer}
              >
                {productImages.map((img, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedImageIndex(index)}
                    style={[
                      styles.thumbnail,
                      selectedImageIndex === index && styles.thumbnailActive,
                    ]}
                  >
                    <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.infoSection}>
            <Text style={styles.productName}>{productName}</Text>

            {/* SKU and Inventory Status Row */}
            <View style={styles.skuInventoryRow}>
              {productSku && (
                <Text style={styles.productSku}>
                  SKU: {productSku}
                  {productBrand && ` | Brand: ${productBrand}`}
                </Text>
              )}
              {product.attributes.inventory_status && (
                <View
                  style={[
                    styles.inventoryBadge,
                    {
                      backgroundColor:
                        getInventoryStatusColor(product.attributes.inventory_status) + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.inventoryText,
                      { color: getInventoryStatusColor(product.attributes.inventory_status) },
                    ]}
                  >
                    {product.attributes.inventory_status}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.priceSection}>
              <Text style={styles.price}>
                {priceAvailable
                  ? `${currencySymbol}${productPrice.toFixed(effectiveConfig.price.precision)} / ${priceUnit}`
                  : `N/A / ${priceUnit}`}
              </Text>
            </View>

            {/* Unit Selector - Always show */}
            <View style={styles.unitSection}>
              {availableUnits.length === 1 ? (
                // Single unit - display as tab with empty space
                <View style={styles.unitTabsContainer}>
                  <View style={[styles.unitTab, styles.unitTabSelected]}>
                    <Text style={[styles.unitTabText, styles.unitTabTextSelected]}>
                      {availableUnits[0].label}
                    </Text>
                  </View>
                  <View style={styles.unitTab}>{/* Empty space for visual consistency */}</View>
                </View>
              ) : availableUnits.length === 2 ? (
                // Two units - display as tabs
                <View style={styles.unitTabsContainer}>
                  {availableUnits.map(unit => (
                    <TouchableOpacity
                      key={unit.code}
                      style={[styles.unitTab, selectedUnit === unit.code && styles.unitTabSelected]}
                      onPress={() => setSelectedUnit(unit.code)}
                    >
                      <Text
                        style={[
                          styles.unitTabText,
                          selectedUnit === unit.code && styles.unitTabTextSelected,
                        ]}
                      >
                        {unit.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : // 3+ units - display as dropdown
              Platform.OS === 'web' ? (
                <View style={styles.unitPickerContainer}>
                  <select
                    value={selectedUnit}
                    onChange={(e: any) => setSelectedUnit(e.target.value)}
                    style={
                      {
                        width: '100%',
                        height: 44,
                        padding: '0 12px',
                        fontSize: 14,
                        color: ShopColors.text,
                        backgroundColor: ShopColors.background,
                        border: `1px solid ${ShopColors.border}`,
                        borderRadius: 8,
                        outline: 'none',
                      } as any
                    }
                  >
                    {availableUnits.map(unit => (
                      <option key={unit.code} value={unit.code}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </View>
              ) : (
                // Native platforms - custom dropdown button
                <>
                  <TouchableOpacity
                    style={styles.unitPickerContainer}
                    onPress={() => setShowUnitPicker(true)}
                  >
                    <Text style={styles.unitPickerText}>
                      {availableUnits.find(u => u.code === selectedUnit)?.label || 'Select Unit'}
                    </Text>
                    <Text style={styles.unitPickerArrow}>▼</Text>
                  </TouchableOpacity>

                  {/* Modal for unit selection */}
                  <Modal
                    visible={showUnitPicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowUnitPicker(false)}
                  >
                    <Pressable style={styles.modalOverlay} onPress={() => setShowUnitPicker(false)}>
                      <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Unit</Text>
                        {availableUnits.map(unit => (
                          <TouchableOpacity
                            key={unit.code}
                            style={[
                              styles.modalOption,
                              selectedUnit === unit.code && styles.modalOptionSelected,
                            ]}
                            onPress={() => {
                              setSelectedUnit(unit.code);
                              setShowUnitPicker(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.modalOptionText,
                                selectedUnit === unit.code && styles.modalOptionTextSelected,
                              ]}
                            >
                              {unit.label}
                            </Text>
                            {selectedUnit === unit.code && (
                              <Text style={styles.modalCheckmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Pressable>
                  </Modal>
                </>
              )}
            </View>

            {/* Tier Prices Table */}
            {product.attributes.prices && product.attributes.prices.length > 0 && (
              <View style={styles.tierPricesSection}>
                <TouchableOpacity
                  style={styles.tierPricesHeader}
                  onPress={() => setShowTierPrices(!showTierPrices)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tierPricesHeaderText}>Volume Pricing</Text>
                  {showTierPrices ? (
                    <ChevronUp size={20} color={ShopColors.text} />
                  ) : (
                    <ChevronDown size={20} color={ShopColors.text} />
                  )}
                </TouchableOpacity>
                {showTierPrices && (
                  <TierPricesTable prices={product.attributes.prices as any} title="" />
                )}
              </View>
            )}

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity onPress={handleDecreaseQuantity} style={styles.quantityButton}>
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={isEditingQuantity ? quantityInput : quantity.toString()}
                  onChangeText={handleQuantityInputChange}
                  onFocus={handleQuantityInputFocus}
                  onBlur={handleQuantityInputBlur}
                  keyboardType={
                    (unitPrecisions.get(currentUnit) ?? 0) > 0 ? 'decimal-pad' : 'numeric'
                  }
                  selectTextOnFocus
                  maxLength={10}
                />
                <TouchableOpacity onPress={handleIncreaseQuantity} style={styles.quantityButton}>
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <HtmlRenderer html={productDescription} />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Panel */}
        <View style={[styles.stickyBottomPanel, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* Share Button */}
          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButtonSticky}
            activeOpacity={0.7}
          >
            <Share2 size={24} color={ShopColors.text} />
          </TouchableOpacity>

          {/* Wishlist Button */}
          <TouchableOpacity
            onPress={() => toggleWishlist(product.id, productSku)}
            style={styles.wishlistButtonSticky}
            activeOpacity={0.7}
          >
            <Heart
              size={24}
              color={inWishlist ? ShopColors.error : ShopColors.text}
              fill={inWishlist ? ShopColors.error : 'none'}
            />
          </TouchableOpacity>

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={styles.addToCartButtonSticky}
            onPress={handleAddToShoppingList}
            activeOpacity={0.7}
          >
            <ShoppingCart size={20} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  contentWrapper: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: ShopColors.background,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
    flex: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: ShopColors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: ShopColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    backgroundColor: '#fff',
    paddingBottom: 0,
    alignItems: 'center',
    flexShrink: 1,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
    flexShrink: 1,
    position: 'relative',
    ...(Platform.OS === 'web' && {
      flexShrink: 1,
      flexGrow: 0,
      flexBasis: 'auto',
    }),
  },
  badgeFeatured: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: ShopColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  badgeNew: {
    position: 'absolute',
    top: 52,
    right: 16,
    backgroundColor: ShopColors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainImage: {
    width: '100%',
    maxWidth: 600,
    aspectRatio: 1,
    backgroundColor: 'transparent',
    flexShrink: 1,
  },
  thumbnailScroll: {
    marginTop: 16,
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    marginRight: 8,
  },
  thumbnailActive: {
    borderColor: ShopColors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 8,
  },
  skuInventoryRow: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  productSku: {
    flex: 1,
    fontSize: 14,
    color: ShopColors.textSecondary,
  },
  inventoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inventoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: ShopColors.primary,
  },
  unitSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
    maxWidth: 400,
  },
  singleUnitContainer: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  singleUnitText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    fontWeight: '500',
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
  },
  unitTabsContainer: {
    flexDirection: 'row',
    backgroundColor: ShopColors.border,
    borderRadius: 8,
    padding: 4,
    flex: 1,
  },
  unitTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitTabSelected: {
    backgroundColor: ShopColors.primary,
  },
  unitTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.textSecondary,
  },
  unitTabTextSelected: {
    color: '#fff',
  },
  unitPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    height: 44,
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  unitPickerText: {
    fontSize: 14,
    color: ShopColors.text,
    flex: 1,
  },
  unitPickerArrow: {
    fontSize: 12,
    color: ShopColors.textSecondary,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: ShopColors.background,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: ShopColors.border,
  },
  modalOptionText: {
    fontSize: 16,
    color: ShopColors.text,
  },
  modalOptionTextSelected: {
    fontWeight: '600',
    color: ShopColors.primary,
  },
  modalCheckmark: {
    fontSize: 18,
    color: ShopColors.primary,
    fontWeight: 'bold',
  },
  tierPricesSection: {
    marginBottom: 24,
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ShopColors.border,
    overflow: 'hidden',
  },
  tierPricesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: ShopColors.cardBackground,
  },
  tierPricesHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    marginRight: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  quantityInput: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    marginHorizontal: 12,
    width: 60,
    maxWidth: 60,
    textAlign: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  // Sticky Bottom Panel
  stickyBottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: ShopColors.background,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    gap: 12,
  },
  shareButtonSticky: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ShopColors.cardBackground,
    borderWidth: 1,
    borderColor: ShopColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistButtonSticky: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ShopColors.cardBackground,
    borderWidth: 1,
    borderColor: ShopColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButtonSticky: {
    flex: 0.75, // 75% of remaining width
    backgroundColor: ShopColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 12,
  },
});
