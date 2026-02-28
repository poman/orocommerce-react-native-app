import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Heart, Info } from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { TierPricesTable } from '@/src/components/TierPricesTable';
import api from '@/src/api/api';
import { ThemeColors } from '@/src/themes/types';

interface UnitOption {
  code: string;
  label: string;
  isDefault?: boolean;
  conversionRate?: number;
}

interface ProductCardProps {
  product: any;
  baseUrl: string;
  isInWishlist?: boolean;
  onToggleWishlist?: (productId: string, productSku: string) => void;
  showAddToCart?: boolean;
  width?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  baseUrl,
  isInWishlist = false,
  onToggleWishlist,
  showAddToCart = true,
  width,
}) => {
  const { colors: ShopColors, effectiveConfig } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const pathname = usePathname();
  const [showInventoryStatus, setShowInventoryStatus] = useState(false);
  const [showTierPrices, setShowTierPrices] = useState(false);
  const [tierPrices, setTierPrices] = useState<any[]>([]);
  const [loadingTierPrices, setLoadingTierPrices] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  const productName = product.attributes.name || 'Unnamed Product';
  const productSku = product.attributes.sku || '';

  const inventoryStatus =
    product.attributes?.inventory_status || product.attributes?.inventoryStatus;

  const getInventoryDotColor = (status?: string): string => {
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

  const inventoryStatusColor = getInventoryDotColor(inventoryStatus);

  // Get available units from product unitPrecisions
  const availableUnits = useMemo<UnitOption[]>(() => {
    if (!product) {
      return [{ code: 'item', label: 'Item', isDefault: true }];
    }

    if (product.attributes?.unitPrecisions && Array.isArray(product.attributes.unitPrecisions)) {
      return product.attributes.unitPrecisions.map((up: any) => ({
        code: up.unit,
        label: up.unit.charAt(0).toUpperCase() + up.unit.slice(1),
        isDefault: up.default || false,
        conversionRate: up.conversionRate || 1,
      }));
    }

    const uniqueUnits = new Set<string>();

    if (product.attributes.prices && product.attributes.prices.length > 0) {
      product.attributes.prices.forEach((price: any) => {
        const unit = price.unit || 'item';
        uniqueUnits.add(unit);
      });
    }
    else if (product.attributes.minimalPrices && product.attributes.minimalPrices.length > 0) {
      product.attributes.minimalPrices.forEach((price: any) => {
        const unit = price.unit || 'item';
        uniqueUnits.add(unit);
      });
    }

    if (uniqueUnits.size === 0) {
      return [{ code: 'item', label: 'Item', isDefault: true }];
    }

    return Array.from(uniqueUnits).map((code, index) => ({
      code,
      label: code.charAt(0).toUpperCase() + code.slice(1),
      isDefault: index === 0,
    }));
  }, [product]);

  const unitPrecisions = useMemo(() => {
    const precisions = new Map<string, number>();
    if (product?.attributes?.unitPrecisions && Array.isArray(product.attributes.unitPrecisions)) {
      product.attributes.unitPrecisions.forEach((up: any) => {
        precisions.set(up.unit, up.precision ?? 0);
      });
    }
    return precisions;
  }, [product]);

  React.useEffect(() => {
    if (!selectedUnit && availableUnits.length > 0) {
      const defaultUnit = availableUnits.find((u: UnitOption) => u.isDefault) || availableUnits[0];
      setSelectedUnit(defaultUnit.code);
    }
  }, [availableUnits, selectedUnit]);

  const { productPrice, currencySymbol, priceUnit, priceRange, priceAvailable } = useMemo(() => {
    const currentUnit =
      selectedUnit ||
      availableUnits.find((u: UnitOption) => u.isDefault)?.code ||
      availableUnits[0]?.code ||
      'item';
    let price = 0;
    let symbol = '$';
    let unit = currentUnit;
    let minPrice: number | null = null;
    let maxPrice: number | null = null;
    let available = false;

    if (tierPrices.length > 0) {
      const unitPrices = tierPrices.filter((p: any) => (p.unit || 'item') === currentUnit);

      if (unitPrices.length > 0) {
        const prices = unitPrices.map((p: any) => parseFloat(p.price));
        minPrice = Math.min(...prices);
        maxPrice = Math.max(...prices);
        price = minPrice;
        symbol =
          unitPrices[0].currencyId === 'EUR' ? '€' : unitPrices[0].currencyId === 'GBP' ? '£' : '$';
        available = true;
      }
    }
    else if (product.attributes.prices && product.attributes.prices.length > 0) {
      const unitPrices = product.attributes.prices.filter(
        (p: any) => (p.unit || 'item') === currentUnit
      );

      if (unitPrices.length > 0) {
        const prices = unitPrices.map((p: any) => parseFloat(p.price));
        minPrice = Math.min(...prices);
        maxPrice = Math.max(...prices);
        price = minPrice;
        symbol =
          unitPrices[0].currencyId === 'EUR' ? '€' : unitPrices[0].currencyId === 'GBP' ? '£' : '$';
        available = true;
      }
    }
    else if (product.attributes.minimalPrices && product.attributes.minimalPrices.length > 0) {
      const unitPrice = product.attributes.minimalPrices.find(
        (p: any) => (p.unit || 'item') === currentUnit
      );

      if (unitPrice) {
        price = parseFloat(unitPrice.price);
        symbol = unitPrice.currencyId === 'EUR' ? '€' : unitPrice.currencyId === 'GBP' ? '£' : '$';
        available = true;
      }
    }
    else if (product.attributes.price) {
      price = product.attributes.price;
      symbol =
        product.attributes.currency === 'EUR'
          ? '€'
          : product.attributes.currency === 'GBP'
            ? '£'
            : '$';
      available = true;
    }

    return {
      productPrice: price,
      currencySymbol: symbol,
      priceUnit: unit,
      priceRange:
        minPrice !== null && maxPrice !== null && minPrice !== maxPrice
          ? { min: minPrice, max: maxPrice }
          : null,
      priceAvailable: available,
    };
  }, [product, selectedUnit, availableUnits, tierPrices]);

  // Get product image
  let productImage = null;
  if (product.images && product.images.length > 0) {
    const image = product.images[0];
    const files = image.attributes.files;

    const largeImage = files.find((f: any) => f.dimension === 'product_large');
    const mediumImage = files.find((f: any) => f.dimension === 'product_medium');
    const extraLargeImage = files.find((f: any) => f.dimension === 'product_extra_large');

    const selectedFile = largeImage || mediumImage || extraLargeImage || files[0];

    if (selectedFile) {
      const imageUrl = selectedFile.url_webp || selectedFile.url;
      if (imageUrl.startsWith('/')) {
        productImage = `${baseUrl.replace(/\/$/, '')}${imageUrl}`;
      } else {
        productImage = imageUrl;
      }
    }
  }

  const handleCardPress = () => {
    router.push(`/product/${product.id}` as any);
  };

  const handleWishlistPress = () => {
    if (onToggleWishlist) {
      onToggleWishlist(product.id, productSku);
    }
  };

  const handleAddToShoppingList = () => {
    router.push({
      pathname: '/shopping-list/add-to-list',
      params: {
        productId: product.id,
        productName: productName,
        productSku: productSku,
        productImage: productImage || '',
        unit: selectedUnit || availableUnits[0]?.code || 'item',
        quantity: quantity.toString(),
        referrer: pathname, // Pass current page as referrer
      },
    } as any);
  };

  const handleQuantityInputChange = (text: string) => {
    const currentUnit = selectedUnit || availableUnits[0]?.code || 'item';
    const currentPrecision = unitPrecisions.get(currentUnit) ?? 0;

    let numericValue = text.replace(/[^0-9.]/g, '');

    const parts = numericValue.split('.');
    if (parts.length > 2) {
      numericValue = parts[0] + '.' + parts.slice(1).join('');
    }

    if (parts.length === 2 && parts[1].length > currentPrecision) {
      numericValue = parts[0] + '.' + parts[1].substring(0, currentPrecision);
    }

    setQuantityInput(numericValue);
  };

  const handleQuantityInputBlur = () => {
    const currentUnit = selectedUnit || availableUnits[0]?.code || 'item';
    const currentPrecision = unitPrecisions.get(currentUnit) ?? 0;
    const parsedQuantity = parseFloat(quantityInput);

    if (parsedQuantity && parsedQuantity > 0) {
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
    const currentUnit = selectedUnit || availableUnits[0]?.code || 'item';
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
    const currentUnit = selectedUnit || availableUnits[0]?.code || 'item';
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

  const fetchTierPrices = async () => {
    if (tierPrices.length > 0) return; // Already fetched

    setLoadingTierPrices(true);
    try {
      const response = await api.get<any>(`products/${product.id}?include=prices`);

      const data = response.data;

      const prices: any[] = [];
      if (data.included) {
        data.included.forEach((item: any) => {
          if (item.type === 'productprices') {
            prices.push({
              price: item.attributes.price,
              currencyId: item.attributes.currency,
              quantity: item.attributes.quantity,
              unit: item.attributes.unit?.code || item.attributes.productUnit || 'item',
            });
          }
        });
      }

      if (data.data?.attributes?.prices && Array.isArray(data.data.attributes.prices)) {
        prices.push(...data.data.attributes.prices);
      }

      setTierPrices(prices);
    } catch (error) {
      console.error('Error fetching tier prices:', error);
    } finally {
      setLoadingTierPrices(false);
    }
  };

  const handleTierPricesClick = async (e: any) => {
    e.stopPropagation();

    if (showInventoryStatus) {
      setShowInventoryStatus(false);
    }

    if (showTierPrices) {
      setShowTierPrices(false);
    } else {
      setShowTierPrices(true);
      if (tierPrices.length === 0) {
        await fetchTierPrices();
      }
    }
  };

  return (
    <View style={[styles.cardWrapper, width ? { width } : { width: '100%' }]}>
      <View style={styles.productCard}>
        <TouchableOpacity
          style={styles.productImageContainer}
          activeOpacity={0.7}
          onPress={handleCardPress}
        >
          <Image
            source={productImage ? { uri: productImage } : require('@/assets/images/no_image.png')}
            style={styles.productImage}
          />
          {onToggleWishlist && (
            <TouchableOpacity
              style={styles.wishlistButton}
              onPress={e => {
                e.stopPropagation();
                if (showInventoryStatus) {
                  setShowInventoryStatus(false);
                }
                if (showTierPrices) {
                  setShowTierPrices(false);
                }
                handleWishlistPress();
              }}
            >
              <Heart
                size={20}
                color={isInWishlist ? ShopColors.error : ShopColors.text}
                fill={isInWishlist ? ShopColors.error : 'transparent'}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.productInfo}>
          <TouchableOpacity onPress={handleCardPress} activeOpacity={0.7}>
            <Text style={styles.productName} numberOfLines={2}>
              {productName}
            </Text>
          </TouchableOpacity>
          {productSku && (
            <View style={styles.skuRow}>
              {inventoryStatus && (
                <View style={styles.inventoryDotContainer}>
                  <TouchableOpacity
                    onPress={e => {
                      e.stopPropagation();
                      setShowInventoryStatus(!showInventoryStatus);
                    }}
                    style={styles.inventoryDotButton}
                  >
                    <View
                      style={[styles.inventoryDot, { backgroundColor: inventoryStatusColor }]}
                    />
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.productSku} numberOfLines={1}>
                SKU: {productSku}
              </Text>
            </View>
          )}

          {/* Unit Selector - Always render to maintain consistent card height */}
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
                {availableUnits.map((unit: UnitOption) => (
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
                  onClick={e => e.stopPropagation()}
                  style={
                    {
                      width: '100%',
                      height: 32,
                      padding: '0 8px',
                      fontSize: 12,
                      color: ShopColors.text,
                      backgroundColor: ShopColors.background,
                      border: `1px solid ${ShopColors.border}`,
                      borderRadius: 6,
                      outline: 'none',
                    } as any
                  }
                >
                  {availableUnits.map((unit: UnitOption) => (
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
                    {availableUnits.find((u: UnitOption) => u.code === selectedUnit)?.label ||
                      'Select Unit'}
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
                      {availableUnits.map((unit: UnitOption) => (
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

          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, screenWidth < 560 && styles.productPriceSmall]}>
              {!priceAvailable
                ? `N/A / ${priceUnit}`
                : priceRange
                  ? `${currencySymbol}${priceRange.min.toFixed(effectiveConfig.price.precision)} - ${currencySymbol}${priceRange.max.toFixed(effectiveConfig.price.precision)} / ${priceUnit}`
                  : `${currencySymbol}${productPrice.toFixed(effectiveConfig.price.precision)} / ${priceUnit}`}
            </Text>
            <TouchableOpacity style={styles.priceInfoButton} onPress={handleTierPricesClick}>
              <Info size={16} color={ShopColors.primary} />
            </TouchableOpacity>
          </View>

          {/* Tier Prices - Expanded inline */}
          {showTierPrices && (
            <>
              {loadingTierPrices ? (
                <View style={styles.tierPricesLoading}>
                  <ActivityIndicator size="small" color={ShopColors.primary} />
                  <Text style={styles.tierPricesLoadingText}>Loading prices...</Text>
                </View>
              ) : tierPrices.length === 0 ? (
                <Text style={styles.tierPricesNoData}>No tier pricing available</Text>
              ) : (
                <TierPricesTable prices={tierPrices} title="" compact={true} />
              )}
            </>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <View style={[styles.quantityControls, styles.quantityControlsFullWidth]}>
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
                  (unitPrecisions.get(selectedUnit || availableUnits[0]?.code || 'item') ?? 0) > 0
                    ? 'decimal-pad'
                    : 'numeric'
                }
                selectTextOnFocus
                maxLength={4}
              />
              <TouchableOpacity onPress={handleIncreaseQuantity} style={styles.quantityButton}>
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showAddToCart && (
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => {
                if (showInventoryStatus) {
                  setShowInventoryStatus(false);
                }
                if (showTierPrices) {
                  setShowTierPrices(false);
                }
                handleAddToShoppingList();
              }}
            >
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Inventory Status Popover - rendered outside card to ensure proper z-index */}
      {showInventoryStatus && inventoryStatus && (
        <View
          style={[
            styles.inventoryStatusPopover,
            {
              backgroundColor: ShopColors.cardBackground,
              borderColor: inventoryStatusColor,
            },
          ]}
        >
          <Text style={[styles.inventoryStatusText, { color: inventoryStatusColor }]}>
            {inventoryStatus}
          </Text>
        </View>
      )}

      {/* Overlay to close popover when clicking outside */}
      {showInventoryStatus && (
        <Pressable style={styles.popoverOverlay} onPress={() => setShowInventoryStatus(false)} />
      )}
    </View>
  );
};

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  productCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    overflow: 'visible',
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
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
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
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
    position: 'relative',
  },
  inventoryDotContainer: {
    marginRight: 0,
    position: 'relative',
  },
  inventoryDotButton: {
    padding: 2,
  },
  inventoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inventoryStatusPopover: {
    position: 'absolute',
    top: 245,
    left: 12,
    minWidth: 112,
    padding: 8,
    borderRadius: 6,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  inventoryStatusText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  productSku: {
    fontSize: 11,
    color: ShopColors.textSecondary,
    flex: 1,
  },
  popoverOverlay: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    right: -10000,
    bottom: -10000,
    zIndex: 999,
    backgroundColor: 'transparent',
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
  productPriceSmall: {
    fontSize: 12, // Smaller font size for screens < 435px
  },
  priceInfoButton: {
    padding: 4,
  },
  unitSection: {
    marginBottom: 8,
    minHeight: 36, // Ensure consistent height for all cards
  },
  unitPlaceholder: {
    height: 32, // Same height as unitTabsContainer/unitPickerContainer
    opacity: 0, // Invisible but reserves space
  },
  singleUnitContainer: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  singleUnitText: {
    fontSize: 12,
    color: ShopColors.textSecondary,
    fontWeight: '500',
  },
  unitTabsContainer: {
    flexDirection: 'row',
    backgroundColor: ShopColors.background,
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  unitTab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  unitTabSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ShopColors.primary,
    shadowColor: ShopColors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  unitTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: ShopColors.textSecondary,
  },
  unitTabTextSelected: {
    color: ShopColors.text,
    fontWeight: '700',
  },
  unitPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 6,
    backgroundColor: ShopColors.background,
    height: 32,
    paddingHorizontal: 8,
  },
  unitPickerText: {
    fontSize: 12,
    color: ShopColors.text,
    flex: 1,
  },
  unitPickerArrow: {
    fontSize: 10,
    color: ShopColors.textSecondary,
    marginLeft: 4,
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
    padding: 16,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: ShopColors.border,
  },
  modalOptionText: {
    fontSize: 14,
    color: ShopColors.text,
  },
  modalOptionTextSelected: {
    fontWeight: '600',
    color: ShopColors.primary,
  },
  modalCheckmark: {
    fontSize: 16,
    color: ShopColors.primary,
    fontWeight: 'bold',
  },
  nativePicker: {
    width: '100%',
    height: 32,
    ...Platform.select({
      ios: {
        height: 32,
      },
      android: {
        height: 32,
        marginTop: -8,
        marginBottom: -8,
      },
    }),
  },
  nativePickerItem: {
    fontSize: 12,
    height: 32,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.border,
    borderRadius: 6,
    padding: 2,
    width: 130,
  },
  quantityControlsFullWidth: {
    width: '100%', // Full width for screens < 435px
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  quantityInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: ShopColors.text,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 52,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  tierPricesLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: ShopColors.background,
    borderRadius: 6,
    marginBottom: 8,
  },
  tierPricesLoadingText: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  tierPricesNoData: {
    fontSize: 12,
    color: ShopColors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
    marginBottom: 8,
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
});
