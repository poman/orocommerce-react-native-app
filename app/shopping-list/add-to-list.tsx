import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Search, Plus, Check, Edit2 } from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import api, { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import { useShoppingLists } from '@/src/api/hooks/useShoppingLists';
import { TierPricesTable } from '@/src/components/TierPricesTable';
import { TopMainMenu } from '@/src/components/TopMainMenu';
import { showToast } from '@/src/utils/toast';
import { ThemeColors } from '@/src/themes/types';

interface UnitOption {
  code: string;
  label: string;
  isDefault?: boolean;
  conversionRate?: number;
}

export default function AddToShoppingListScreen() {
  const { colors: ShopColors, effectiveConfig } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { baseUrl } = useConfig();
  const { isAuthenticated, getValidAccessToken } = useAuth();
  const insets = useSafeAreaInsets();

  const productId = params.productId as string;
  const productName = params.productName as string;
  const productSku = params.productSku as string;
  const productImage = params.productImage as string;
  const initialUnit = params.unit as string;
  const initialQuantity = parseFloat(params.quantity as string) || 1;
  const referrer = params.referrer as string; // Track where user came from

  const [product, setProduct] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState(initialUnit || '');
  const [quantity, setQuantity] = useState(initialQuantity);
  const [tierPrices, setTierPrices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingNewList, setCreatingNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [quantityInput, setQuantityInput] = useState(initialQuantity.toString());
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const [showProductDetails, setShowProductDetails] = useState(false);

  const {
    loading: loadingLists,
    shoppingLists,
    createList,
    addItemToList,
    refetch,
  } = useShoppingLists(
    {
      page: { number: 1, size: effectiveConfig.shoppingList.defaultPageSize },
    },
    baseUrl,
    getValidAccessToken
  );

  useEffect(() => {
    if (baseUrl) {
      initializeApi(baseUrl);
      if (getValidAccessToken) {
        setAuthTokenGetter(getValidAccessToken);
      }
    }
  }, [baseUrl, getValidAccessToken]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || !baseUrl) return;

      setLoadingProduct(true);
      try {
        const response = await api.get<any>(`products/${productId}?include=prices,images`);

        const data = response.data;
        setProduct(data.data);

        // Extract product image - check both product.images and included data
        let imageUrl: string | null = null;

        if (data.data?.images && data.data.images.length > 0) {
          const image = data.data.images[0];
          const files = image.attributes?.files;

          if (files) {
            const largeImage = files.find((f: any) => f.dimension === 'product_large');
            const mediumImage = files.find((f: any) => f.dimension === 'product_medium');
            const extraLargeImage = files.find((f: any) => f.dimension === 'product_extra_large');

            const selectedFile = largeImage || mediumImage || extraLargeImage || files[0];

            if (selectedFile) {
              const url = selectedFile.url_webp || selectedFile.url;
              imageUrl = url.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${url}` : url;
            }
          }
        }

        if (!imageUrl && data.included) {
          const imageData = data.included.find((item: any) => item.type === 'productimages');
          if (imageData?.attributes?.files) {
            const files = imageData.attributes.files;
            const largeImage = files.find((f: any) => f.dimension === 'product_large');
            const mediumImage = files.find((f: any) => f.dimension === 'product_medium');
            const extraLargeImage = files.find((f: any) => f.dimension === 'product_extra_large');

            const selectedFile = largeImage || mediumImage || extraLargeImage || files[0];

            if (selectedFile) {
              const url = selectedFile.url_webp || selectedFile.url;
              imageUrl = url.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${url}` : url;
            }
          }
        }

        setProductImageUrl(imageUrl);

        // Extract tier prices
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
      } catch (_error) {
        showToast('Failed to load product details', 'error');
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId, baseUrl]);

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

    return [{ code: 'item', label: 'Item', isDefault: true }];
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

  useEffect(() => {
    if (!selectedUnit && availableUnits.length > 0) {
      const defaultUnit = availableUnits.find((u: UnitOption) => u.isDefault) || availableUnits[0];
      setSelectedUnit(defaultUnit.code);
    }
  }, [availableUnits, selectedUnit]);

  useEffect(() => {
    if (!selectedListId && shoppingLists.length > 0 && !loadingLists) {
      const defaultList = shoppingLists.find(list => list.attributes.default);
      if (defaultList) {
        setSelectedListId(defaultList.id);
      }
    }
  }, [shoppingLists, loadingLists, selectedListId]);

  const { productPrice, currencySymbol } = useMemo(() => {
    const currentUnit = selectedUnit || availableUnits[0]?.code || 'item';
    let price = 0;
    let symbol = '$';
    let unit = currentUnit;
    let minPrice: number | null = null;
    let maxPrice: number | null = null;

    const unitPrices = tierPrices.filter((p: any) => (p.unit || 'item') === currentUnit);

    if (unitPrices.length > 0) {
      const sortedPrices = [...unitPrices].sort(
        (a, b) => parseFloat(a.quantity) - parseFloat(b.quantity)
      );
      const applicablePrice =
        sortedPrices.reverse().find((p: any) => parseFloat(p.quantity) <= quantity) ||
        sortedPrices[0];

      price = parseFloat(applicablePrice.price);
      symbol =
        applicablePrice.currencyId === 'EUR'
          ? '€'
          : applicablePrice.currencyId === 'GBP'
            ? '£'
            : '$';

      if (unitPrices.length > 1) {
        const prices = unitPrices.map((p: any) => parseFloat(p.price));
        minPrice = Math.min(...prices);
        maxPrice = Math.max(...prices);
      }
    }

    return {
      productPrice: price,
      currencySymbol: symbol,
      priceUnit: unit,
      priceRange:
        minPrice !== null && maxPrice !== null && minPrice !== maxPrice
          ? { min: minPrice, max: maxPrice }
          : null,
    };
  }, [tierPrices, selectedUnit, availableUnits, quantity]);

  const filteredLists = useMemo(() => {
    if (!searchQuery.trim()) return shoppingLists;
    const query = searchQuery.toLowerCase();
    return shoppingLists.filter(list => list.attributes.name.toLowerCase().includes(query));
  }, [shoppingLists, searchQuery]);

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

  const handleSelectList = (listId: string) => {
    setSelectedListId(listId);
  };

  const handleAddToList = async (action: 'continue' | 'openList') => {
    if (!product || !selectedUnit || !selectedListId) return;

    setAddingToList(selectedListId);
    try {
      const unitPrecision = product.attributes.unitPrecisions?.find(
        (up: any) => up.unit === selectedUnit
      );

      if (!unitPrecision) {
        showToast('Invalid unit selected', 'error');
        setAddingToList(null);
        return;
      }

      const success = await addItemToList({
        shoppingListId: selectedListId,
        productId: product.id,
        unitId: selectedUnit,
        quantity: quantity,
      });

      if (success) {
        showToast('Product added to shopping list', 'success');

        if (action === 'openList') {
          router.push(`/shopping-list/${selectedListId}`);
        } else {
          if (referrer) {
            router.push(referrer as any);
          } else {
            router.back();
          }
        }
      } else {
        showToast('Failed to add product to shopping list', 'error');
      }
    } catch (_error) {
      showToast('Failed to add product to shopping list', 'error');
    } finally {
      setAddingToList(null);
    }
  };

  const handleCreateNewList = async () => {
    if (!newListName.trim()) {
      showToast('Please enter a list name', 'error');
      return;
    }

    try {
      const newList = await createList({
        name: newListName.trim(),
        default: false,
      });
      if (newList) {
        setCreatingNewList(false);
        setNewListName('');
        await refetch();
        showToast('Shopping list created', 'success');
      }
    } catch (_error) {
      showToast('Failed to create shopping list', 'error');
    }
  };

  const handleBack = () => {
    if (referrer) {
      router.push(referrer as any);
    } else {
      router.back();
    }
  };

  const handleSearch = () => {
    router.push('/(tabs)/search');
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Custom Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={ShopColors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Shopping List</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleSearch} style={styles.iconButton}>
                <Search size={24} color={ShopColors.text} />
              </TouchableOpacity>
              <TopMainMenu />
            </View>
          </View>
        </View>

        <View style={styles.notAuthenticatedContainer}>
          <Text style={styles.notAuthenticatedText}>
            Please log in to add products to shopping lists
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login?redirect=shopping-list-add')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Shopping List</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleSearch} style={styles.iconButton}>
              <Search size={24} color={ShopColors.text} />
            </TouchableOpacity>
            <TopMainMenu />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Info */}
        {loadingProduct ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ShopColors.primary} />
          </View>
        ) : (
          <View style={styles.productSection}>
            <View style={styles.productHeader}>
              <Image
                source={
                  productImageUrl || productImage
                    ? { uri: productImageUrl || productImage }
                    : require('@/assets/images/no_image.png')
                }
                style={styles.productImage}
              />
              <View style={styles.productHeaderInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {productName}
                </Text>
                <Text style={styles.productSku}>SKU: {productSku}</Text>
              </View>
            </View>

            {/* Product Details - Single Collapsible Section */}
            <View style={styles.productDetailsSection}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => setShowProductDetails(!showProductDetails)}
                activeOpacity={0.7}
              >
                <View style={styles.collapsibleHeaderContent}>
                  <Text style={styles.sectionLabel}>Product Details</Text>
                  <Text style={styles.collapsibleSubtext}>
                    {availableUnits.find(u => u.code === selectedUnit)?.label || selectedUnit} •
                    Qty: {quantity}
                  </Text>
                </View>
                <View style={styles.collapsibleHeaderIcons}>
                  <Edit2 size={18} color={ShopColors.primary} />
                  <Text style={styles.editText}>Edit</Text>
                </View>
              </TouchableOpacity>

              {showProductDetails && (
                <>
                  {/* Unit Selector */}
                  {availableUnits.length > 1 && (
                    <View style={styles.unitSection}>
                      <Text style={styles.sectionLabel}>Unit</Text>
                      {availableUnits.length === 2 ? (
                        <View style={styles.unitTabsContainer}>
                          {availableUnits.map((unit: UnitOption) => (
                            <TouchableOpacity
                              key={unit.code}
                              style={[
                                styles.unitTab,
                                selectedUnit === unit.code && styles.unitTabSelected,
                              ]}
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
                      ) : (
                        <View style={styles.unitPickerContainer}>
                          {Platform.OS === 'web' ? (
                            <select
                              value={selectedUnit}
                              onChange={(e: any) => setSelectedUnit(e.target.value)}
                              style={
                                {
                                  width: '100%',
                                  height: 40,
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
                              {availableUnits.map((unit: UnitOption) => (
                                <option key={unit.code} value={unit.code}>
                                  {unit.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            // Native platforms - custom dropdown button
                            <>
                              <TouchableOpacity
                                style={styles.unitPickerButton}
                                onPress={() => setShowUnitPicker(true)}
                              >
                                <Text style={styles.unitPickerText}>
                                  {availableUnits.find(u => u.code === selectedUnit)?.label ||
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
                                <Pressable
                                  style={styles.modalOverlay}
                                  onPress={() => setShowUnitPicker(false)}
                                >
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
                                            selectedUnit === unit.code &&
                                              styles.modalOptionTextSelected,
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
                      )}
                    </View>
                  )}

                  {/* Tier Prices */}
                  {tierPrices.length > 0 && (
                    <View style={styles.tierPricesSection}>
                      <TierPricesTable
                        prices={tierPrices.filter((p: any) => (p.unit || 'item') === selectedUnit)}
                        title="Pricing"
                        compact={false}
                      />
                    </View>
                  )}

                  {/* Quantity Selector */}
                  <View style={styles.quantitySection}>
                    <Text style={styles.sectionLabel}>Quantity</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        onPress={handleDecreaseQuantity}
                        style={styles.quantityButton}
                      >
                        <Text style={styles.quantityButtonText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.quantityInput}
                        value={isEditingQuantity ? quantityInput : quantity.toString()}
                        onChangeText={handleQuantityInputChange}
                        onFocus={handleQuantityInputFocus}
                        onBlur={handleQuantityInputBlur}
                        keyboardType={
                          (unitPrecisions.get(selectedUnit || availableUnits[0]?.code || 'item') ??
                            0) > 0
                            ? 'decimal-pad'
                            : 'numeric'
                        }
                        selectTextOnFocus
                      />
                      <TouchableOpacity
                        onPress={handleIncreaseQuantity}
                        style={styles.quantityButton}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Shopping Lists */}
        <View style={styles.listsSection}>
          <View style={styles.listsSectionHeader}>
            <Text style={styles.listsSectionTitle}>Select Shopping List</Text>
            <TouchableOpacity
              style={styles.createListButton}
              onPress={() => setCreatingNewList(true)}
            >
              <Plus size={20} color={ShopColors.primary} />
              <Text style={styles.createListButtonText}>Create New</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Search size={20} color={ShopColors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search shopping lists..."
              placeholderTextColor={ShopColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Create New List Form */}
          {creatingNewList && (
            <View style={styles.createListForm}>
              <TextInput
                style={styles.newListInput}
                placeholder="Enter list name..."
                placeholderTextColor={ShopColors.textSecondary}
                value={newListName}
                onChangeText={setNewListName}
                autoFocus
              />
              <View style={styles.createListActions}>
                <TouchableOpacity
                  style={styles.createListActionButton}
                  onPress={() => {
                    setCreatingNewList(false);
                    setNewListName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createListActionButton, styles.createListActionButtonPrimary]}
                  onPress={handleCreateNewList}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Lists */}
          {loadingLists ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ShopColors.primary} />
            </View>
          ) : filteredLists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No shopping lists found' : 'No shopping lists yet'}
              </Text>
            </View>
          ) : (
            <View style={styles.listsList}>
              {filteredLists.map(list => (
                <TouchableOpacity
                  key={list.id}
                  style={[
                    styles.listItem,
                    list.attributes.default && styles.listItemDefault,
                    selectedListId === list.id && styles.listItemSelected,
                  ]}
                  onPress={() => handleSelectList(list.id)}
                  disabled={addingToList !== null}
                >
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemName}>
                      {list.attributes.name}
                      {list.attributes.default && (
                        <Text style={styles.defaultBadge}> (Default)</Text>
                      )}
                    </Text>
                    <Text style={styles.listItemTotal}>
                      Total: {currencySymbol}
                      {parseFloat(list.attributes.total).toFixed(effectiveConfig.price.precision)}
                    </Text>
                  </View>
                  {selectedListId === list.id && <Check size={24} color={ShopColors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      {selectedListId && !loadingProduct && (
        <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.stickyFooterContent}>
            <View style={styles.footerSummary}>
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Unit:</Text>
                <Text style={styles.footerValue}>
                  {availableUnits.find(u => u.code === selectedUnit)?.label || selectedUnit}
                </Text>
              </View>
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Quantity:</Text>
                <Text style={styles.footerValue}>{quantity}</Text>
              </View>
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Price:</Text>
                <Text style={styles.footerValue}>
                  {currencySymbol}
                  {productPrice.toFixed(effectiveConfig.price.precision)}
                </Text>
              </View>
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Total:</Text>
                <Text style={[styles.footerValue, styles.footerTotal]}>
                  {currencySymbol}
                  {(productPrice * quantity).toFixed(effectiveConfig.price.precision)}
                </Text>
              </View>
            </View>
            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={[
                  styles.addToListButton,
                  styles.addToListButtonPrimary,
                  addingToList && styles.addToListButtonDisabled,
                ]}
                onPress={() => handleAddToList('openList')}
                disabled={addingToList !== null}
              >
                {addingToList ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addToListButtonText}>Add to Cart</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  header: {
    backgroundColor: ShopColors.background,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  headerContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
    marginHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notAuthenticatedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: ShopColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  productSection: {
    backgroundColor: ShopColors.cardBackground,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: ShopColors.border,
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: ShopColors.border,
  },
  productHeaderInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 8,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: ShopColors.background,
    borderRadius: 8,
  },
  unitSection: {
    marginBottom: 16,
    maxWidth: 500,
  },
  unitTabsContainer: {
    flexDirection: 'row',
    backgroundColor: ShopColors.border,
    borderRadius: 8,
    padding: 2,
  },
  unitTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    color: '#FFFFFF',
  },
  unitPickerContainer: {
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    backgroundColor: ShopColors.background,
    height: 40,
  },
  unitPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 40,
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
  priceSection: {
    marginBottom: 16,
  },
  unitPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
  },
  tierPricesSection: {
    marginBottom: 16,
  },
  quantitySection: {
    marginBottom: 8,
    maxWidth: 500,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.border,
    borderRadius: 8,
    padding: 2,
  },
  quantityButton: {
    width: 40,
    height: 40,
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
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  listsSection: {
    padding: 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  listsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  createListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.primary,
  },
  createListButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: ShopColors.text,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  createListForm: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
    maxWidth: 500,
  },
  newListInput: {
    fontSize: 14,
    color: ShopColors.text,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: ShopColors.background,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  createListActions: {
    flexDirection: 'row',
    gap: 12,
  },
  createListActionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ShopColors.border,
    backgroundColor: ShopColors.background,
  },
  createListActionButtonPrimary: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    textAlign: 'center',
  },
  listsList: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  listItemDefault: {
    borderWidth: 1,
  },
  listItemSelected: {
    backgroundColor: ShopColors.primary + '10', // 10% opacity
    borderColor: ShopColors.primary,
    borderWidth: 2,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 4,
  },
  defaultBadge: {
    fontSize: 14,
    fontWeight: '500',
    color: ShopColors.primary,
  },
  listItemTotal: {
    fontSize: 14,
    color: ShopColors.textSecondary,
  },
  stickyFooter: {
    backgroundColor: ShopColors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  stickyFooterContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
    gap: 16,
  },
  footerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  footerRow: {
    flex: 1,
    gap: 4,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: ShopColors.text,
  },
  footerTotal: {
    fontSize: 16,
    color: ShopColors.primary,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addToListButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  addToListButtonPrimary: {
    backgroundColor: ShopColors.primary,
  },
  addToListButtonSecondary: {
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.primary,
  },
  addToListButtonDisabled: {
    opacity: 0.6,
  },
  addToListButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  addToListButtonTextSecondary: {
    color: ShopColors.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  collapsibleHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  collapsibleHeaderContent: {
    flex: 1,
  },
  collapsibleSubtext: {
    fontSize: 12,
    color: ShopColors.textSecondary,
    marginTop: 4,
  },
  productDetailsSection: {
    marginBottom: 4,
  },
});
