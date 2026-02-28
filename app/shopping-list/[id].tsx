import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Edit2,
  FilePlus,
  Heart,
  Info,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { useConfig } from '@/src/context/ConfigContext';
import { formatDiscount, formatPrice } from '@/src/utils/priceFormatter';
import { useAuth } from '@/src/context/AuthContext';
import { useShop } from '@/src/context/ShopContext';
import { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import {
  deleteShoppingList,
  deleteShoppingListItem,
  getShoppingListItems,
  IShoppingListItem,
  setShoppingListAsDefault,
  updateShoppingList,
  updateShoppingListItem,
} from '@/src/api/helpers/shoppingLists';
import { showToast } from '@/src/utils/toast';
import CustomAlert from '@/src/components/CustomAlert';
import { TierPricesTable } from '@/src/components/TierPricesTable';
import { MainMenu } from '@/src/components/MainMenu';
import { ThemeColors } from '@/src/themes/types';

interface ProductData {
  id: string;
  type: string;
  attributes: {
    name: string;
    sku: string;
    prices?: Array<{
      price: string;
      currencyId: string;
      quantity: string;
      unit: string;
    }>;
    unitPrecisions?: Array<{
      unit: string;
      precision: number;
      conversionRate?: number;
      default?: boolean;
    }>;
    inventory_status?: string;
  };
  relationships?: {
    images?: {
      data: Array<{ id: string; type: string }>;
    };
    inventory_status?: {
      data: { id: string; type: string } | null;
    };
    inventoryStatus?: {
      data: { id: string; type: string } | null;
    };
    unitPrecisions?: {
      data: Array<{ id: string; type: string }>;
    };
  };
}

interface ImageData {
  id: string;
  type: string;
  attributes: {
    updatedAt?: string;
    mimeType?: string;
    types?: string[];
    files?: Array<{
      url: string;
      maxWidth?: number | string | null;
      maxHeight?: number | string | null;
      dimension?: string;
      url_webp?: string;
      types?: string[];
    }>;
    url?: string; // Fallback for simple structure
    [key: string]: any; // Allow other properties
  };
}

interface UnitData {
  id: string;
  type: string;
  attributes: {
    code: string;
    label?: string;
    defaultPrecision?: number;
    [key: string]: any;
  };
}

interface UnitPrecisionData {
  id: string;
  type: string;
  attributes: {
    precision: number;
    conversionRate?: number;
    sell?: boolean;
    [key: string]: any;
  };
  relationships?: {
    unit?: {
      data: { id: string; type: string } | null;
    };
  };
}

export default function ShoppingListDetailScreen() {
  const { colors: ShopColors, effectiveConfig } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { baseUrl } = useConfig();
  const { getValidAccessToken } = useAuth();
  const { toggleWishlist, isInWishlist } = useShop();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<IShoppingListItem[]>([]);
  const [products, setProducts] = useState<Map<string, ProductData>>(new Map());
  const [images, setImages] = useState<Map<string, ImageData>>(new Map());
  const [units, setUnits] = useState<Map<string, UnitData>>(new Map());
  const [unitPrecisions, setUnitPrecisions] = useState<Map<string, UnitPrecisionData>>(new Map());
  const [shoppingListName, setShoppingListName] = useState<string>('Shopping List');
  const [isDefaultList, setIsDefaultList] = useState<boolean>(false);
  const [shoppingListNote, setShoppingListNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [isRemovingItem, setIsRemovingItem] = useState(false);

  const [openMenuItemId, setOpenMenuItemId] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showUnitModalForItem, setShowUnitModalForItem] = useState<string | null>(null);
  const [showPriceInfoForItem, setShowPriceInfoForItem] = useState<string | null>(null);
  const [showInventoryStatusForItem, setShowInventoryStatusForItem] = useState<string | null>(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Quantity and unit editing state
  const [changedQuantities, setChangedQuantities] = useState<Map<string, number>>(new Map());
  const [changedUnits, setChangedUnits] = useState<Map<string, string>>(new Map()); // itemId -> unitId
  const [isUpdatingQuantities, setIsUpdatingQuantities] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      if (!id || !baseUrl) return;

      try {
        setLoading(true);
        setError(null);

        initializeApi(baseUrl);
        setAuthTokenGetter(getValidAccessToken);

        const result = await getShoppingListItems({
          shoppingListId: id,
          page: { number: 1, size: 100 },
          include:
            'product,product.images,product.inventoryStatus,product.unitPrecisions,unit,shoppingList',
        });

        setItems(result.data || []);

        if (result.included) {
          const productsMap = new Map<string, ProductData>();
          const imagesMap = new Map<string, ImageData>();
          const inventoryStatusMap = new Map<string, any>();
          const unitsMap = new Map<string, UnitData>();
          const unitPrecisionsMap = new Map<string, UnitPrecisionData>();

          result.included.forEach((it: any) => {
            if (it.type === 'products') {
              productsMap.set(it.id, it);
            } else if (it.type === 'productimages') {
              imagesMap.set(it.id, it);
            } else if (it.type === 'productinventorystatuses') {
              inventoryStatusMap.set(it.id, it);
            } else if (it.type === 'productunits') {
              unitsMap.set(it.id, it);
            } else if (it.type === 'productunitprecisions') {
              unitPrecisionsMap.set(it.id, it);
            } else if (it.type === 'shoppinglists' && it.id === id) {
              setShoppingListName(it.attributes?.name || 'Shopping List');
              setIsDefaultList(it.attributes?.default || false);
              setShoppingListNote(it.attributes?.notes || '');
            }
          });

          productsMap.forEach((product, _productId) => {
            if (product.relationships?.inventoryStatus?.data?.id) {
              const statusId = product.relationships.inventoryStatus.data.id;
              const statusData = inventoryStatusMap.get(statusId);
              if (statusData) {
                product.attributes.inventory_status =
                  statusData.attributes?.name || statusData.attributes?.label || statusId;
              }
            }
          });

          setProducts(productsMap);
          setImages(imagesMap);
          setUnits(unitsMap);
          setUnitPrecisions(unitPrecisionsMap);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load shopping list items');
        showToast('Failed to load shopping list items', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [id, baseUrl, getValidAccessToken]);

  const getProductImage = (product: ProductData): string | null => {
    const rel = product.relationships?.images?.data;
    if (!rel || rel.length === 0) {
      return null;
    }
    const imageId = rel[0].id;
    const imageData = images.get(imageId);
    if (!imageData) {
      return null;
    }

    let imageUrl: string | null = null;

    if (imageData.attributes?.files && imageData.attributes.files.length > 0) {
      imageUrl = imageData.attributes.files[0].url;
    } else if (imageData.attributes?.url) {
      imageUrl = imageData.attributes.url;
    }

    if (!imageUrl) {
      return null;
    }

    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${cleanBaseUrl}${cleanImageUrl}`;
  };

  const getInventoryDotColor = (status?: string): string => {
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

  const getAvailableUnits = (
    product: ProductData
  ): Array<{ id: string; code: string; label?: string }> => {
    const unitPrecisionsArray = product.attributes?.unitPrecisions;
    if (unitPrecisionsArray && Array.isArray(unitPrecisionsArray)) {
      const availableUnits: Array<{ id: string; code: string; label?: string }> = [];

      unitPrecisionsArray.forEach((precision: any) => {
        const unitCode = precision.unit;
        if (unitCode) {
          const unitData = Array.from(units.values()).find(u => u.attributes.code === unitCode);
          availableUnits.push({
            id: unitCode,
            code: unitCode,
            label: unitData?.attributes.label || unitCode,
          });
        }
      });

      return availableUnits;
    }

    const unitPrecisionRefs = product.relationships?.unitPrecisions?.data;
    if (!unitPrecisionRefs || unitPrecisionRefs.length === 0) return [];

    const availableUnits: Array<{ id: string; code: string; label?: string }> = [];

    unitPrecisionRefs.forEach(ref => {
      const unitPrecision = unitPrecisions.get(ref.id);
      if (unitPrecision?.relationships?.unit?.data?.id) {
        const unitId = unitPrecision.relationships.unit.data.id;
        const unitData = units.get(unitId);
        if (unitData) {
          availableUnits.push({
            id: unitData.id,
            code: unitData.attributes.code,
            label: unitData.attributes.label || unitData.attributes.code,
          });
        }
      }
    });

    return availableUnits;
  };

  const getUnitLabel = (unit: any): string => {
    if (!unit) return '';
    if (unit.label) return unit.label;
    if (unit.code) return unit.code;
    if (unit.attributes?.label) return unit.attributes.label;
    if (unit.attributes?.code) return unit.attributes.code;
    return '';
  };

  const handleRemoveItem = async (itemId: string) => {
    setItemToRemove(itemId);
  };

  const confirmRemoveItem = async () => {
    if (!itemToRemove) return;

    try {
      setIsRemovingItem(true);
      await deleteShoppingListItem(itemToRemove);

      setItems(prevItems => prevItems.filter(item => item.id !== itemToRemove));
      showToast('Item removed from shopping list', 'success');
      setItemToRemove(null);
    } catch (_err: any) {
      showToast('Failed to remove item', 'error');
    } finally {
      setIsRemovingItem(false);
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    const product = products.get(productId);
    if (!product) {
      showToast('Product not found', 'error');
      return;
    }

    const productSku = product.attributes.sku;
    const wasInWishlist = isInWishlist(productId);

    toggleWishlist(productId, productSku);

    if (wasInWishlist) {
      showToast('Removed from wishlist', 'success');
    } else {
      showToast('Added to wishlist', 'success');
    }
  };

  const handleCheckout = () => {
    if (!id) return;

    const checkoutPath = `/checkout/${id}?name=${encodeURIComponent(shoppingListName)}`;

    router.push(checkoutPath as any);
  };

  const handleStartEditName = () => {
    setEditedName(shoppingListName);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      showToast('Shopping list name cannot be empty', 'error');
      return;
    }
    if (editedName.trim() === shoppingListName) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsUpdating(true);
      await updateShoppingList({ id: id as string, name: editedName.trim() });
      setShoppingListName(editedName.trim());
      setIsEditingName(false);
      showToast('Shopping list name updated', 'success');
    } catch (_err: any) {
      showToast('Failed to update shopping list name', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartEditNote = () => {
    setEditedNote(shoppingListNote);
    setIsEditingNote(true);
    setShowHeaderMenu(false);
  };

  const handleCancelEditNote = () => {
    setIsEditingNote(false);
    setEditedNote('');
  };

  const handleSaveNote = async () => {
    if (editedNote.trim() === shoppingListNote) {
      setIsEditingNote(false);
      return;
    }

    try {
      setIsUpdating(true);
      await updateShoppingList({
        id: id as string,
        notes: editedNote.trim() || '',
      });
      setShoppingListNote(editedNote.trim());
      setIsEditingNote(false);
      showToast(editedNote.trim() ? 'Note saved' : 'Note removed', 'success');
    } catch (_err: any) {
      showToast('Failed to update note', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveNote = async () => {
    try {
      setIsUpdating(true);
      await updateShoppingList({
        id: id as string,
        notes: '',
      });
      setShoppingListNote('');
      setEditedNote('');
      setIsEditingNote(false);
      showToast('Note removed', 'success');
    } catch (_err: any) {
      showToast('Failed to remove note', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = () => setShowDeleteConfirm(true);

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await deleteShoppingList(id as string);
      showToast('Shopping list deleted', 'success');
      setTimeout(() => router.push('/(tabs)/shopping-lists'), 500);
    } catch (_err: any) {
      showToast('Failed to delete shopping list', 'error');
      setIsDeleting(false);
    }
  };

  const handleSetAsDefault = async () => {
    try {
      setIsUpdating(true);
      setShowHeaderMenu(false);
      await setShoppingListAsDefault(id as string);
      setIsDefaultList(true);
      showToast('Shopping list set as default', 'success');
    } catch (_err: any) {
      showToast('Failed to set shopping list as default', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return; // Don't allow 0 or negative quantities

    const currentItem = items.find(item => item.id === itemId);
    if (!currentItem) return;

    // If quantity returns to original, remove from changed quantities
    if (newQuantity === currentItem.attributes.quantity) {
      setChangedQuantities(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    } else {
      setChangedQuantities(prev => new Map(prev).set(itemId, newQuantity));
    }
  };

  const handleUnitChange = (itemId: string, newUnitId: string) => {
    const currentItem = items.find(item => item.id === itemId);
    if (!currentItem) return;

    const currentUnitId = currentItem.relationships.unit.data.id;

    // If unit returns to original, remove from changed units
    if (newUnitId === currentUnitId) {
      setChangedUnits(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    } else {
      setChangedUnits(prev => new Map(prev).set(itemId, newUnitId));
    }
  };

  const handleUpdateQuantities = async () => {
    if (changedQuantities.size === 0 && changedUnits.size === 0) return;

    try {
      setIsUpdatingQuantities(true);

      // Get all unique item IDs that have been changed
      const changedItemIds = new Set([
        ...Array.from(changedQuantities.keys()),
        ...Array.from(changedUnits.keys()),
      ]);

      // Update all changed items
      const updatePromises = Array.from(changedItemIds).map(itemId => {
        const params: any = { itemId };

        const newQuantity = changedQuantities.get(itemId);
        if (newQuantity !== undefined) {
          params.quantity = newQuantity;
        }

        const newUnitId = changedUnits.get(itemId);
        if (newUnitId !== undefined) {
          params.unitId = newUnitId;
        }

        return updateShoppingListItem(params);
      });

      await Promise.all(updatePromises);

      // Update local state with new quantities and units
      setItems(prevItems =>
        prevItems.map(item => {
          const newQuantity = changedQuantities.get(item.id);
          const newUnitId = changedUnits.get(item.id);

          if (newQuantity !== undefined || newUnitId !== undefined) {
            return {
              ...item,
              attributes: {
                ...item.attributes,
                ...(newQuantity !== undefined && { quantity: newQuantity }),
              },
              relationships: {
                ...item.relationships,
                ...(newUnitId !== undefined && {
                  unit: {
                    data: {
                      type: 'productunits',
                      id: newUnitId,
                    },
                  },
                }),
              },
            };
          }
          return item;
        })
      );

      // Clear changed quantities and units
      setChangedQuantities(new Map());
      setChangedUnits(new Map());
      showToast('Shopping list updated successfully', 'success');

      const result = await getShoppingListItems({
        shoppingListId: id as string,
        page: { number: 1, size: 100 },
        include:
          'product,product.images,product.inventoryStatus,product.unitPrecisions,unit,shoppingList',
      });
      setItems(result.data || []);
    } catch (_err: any) {
      showToast('Failed to update quantities', 'error');
    } finally {
      setIsUpdatingQuantities(false);
    }
  };

  const handleResetQuantities = () => {
    setChangedQuantities(new Map());
    setChangedUnits(new Map());
    showToast('Changes discarded', 'info');
  };

  const getCurrentQuantity = (itemId: string): number => {
    return (
      changedQuantities.get(itemId) ??
      items.find(item => item.id === itemId)?.attributes.quantity ??
      1
    );
  };

  const getCurrentUnit = (itemId: string): string => {
    const changedUnitId = changedUnits.get(itemId);
    if (changedUnitId) return changedUnitId;

    const item = items.find(item => item.id === itemId);
    return item?.relationships.unit.data.id ?? '';
  };

  const getPriceForUnit = (
    product: ProductData,
    unitId: string,
    quantity: number
  ): { unitPrice: string | null; subTotal: string | null } => {
    const prices = product.attributes.prices;

    if (!prices || prices.length === 0) {
      return { unitPrice: null, subTotal: null };
    }

    // Find the price for the specific unit and quantity (tier pricing)
    const unitPrices = prices
      .filter((p: any) => p.unit === unitId)
      .sort((a: any, b: any) => parseFloat(b.quantity) - parseFloat(a.quantity));

    if (unitPrices.length === 0) {
      return { unitPrice: null, subTotal: null };
    }

    // Find the appropriate tier based on quantity
    const applicablePrice =
      unitPrices.find((p: any) => quantity >= parseFloat(p.quantity)) ||
      unitPrices[unitPrices.length - 1];

    const unitPrice = applicablePrice.price;
    const subTotal = (parseFloat(unitPrice) * quantity).toFixed(2);

    return { unitPrice, subTotal };
  };

  const getAllPricesByUnit = (
    product: ProductData
  ): Map<string, Array<{ quantity: string; price: string }>> => {
    const pricesByUnit = new Map<string, Array<{ quantity: string; price: string }>>();
    const prices = product.attributes.prices;

    if (!prices || prices.length === 0) {
      return pricesByUnit;
    }

    prices.forEach((price: any) => {
      const unitCode = price.unit;
      if (!pricesByUnit.has(unitCode)) {
        pricesByUnit.set(unitCode, []);
      }
      pricesByUnit.get(unitCode)!.push({
        quantity: price.quantity,
        price: price.price,
      });
    });

    // Sort each unit's prices by quantity ascending
    pricesByUnit.forEach((unitPrices, _unit) => {
      unitPrices.sort((a, b) => parseFloat(a.quantity) - parseFloat(b.quantity));
    });

    console.log('📊 Prices by unit for product:', product.id, pricesByUnit);
    return pricesByUnit;
  };

  const calculateShoppingListTotals = () => {
    let subtotal = 0;
    let discount = 0;
    let itemCount = 0;

    items.forEach(item => {
      itemCount++;

      if (item.attributes.subTotal) {
        subtotal += parseFloat(item.attributes.subTotal);
      }

      if (item.attributes.discount) {
        discount += parseFloat(item.attributes.discount);
      }
    });

    const total = subtotal + discount;

    return {
      itemCount,
      subtotal: formatPrice(subtotal.toString()),
      discount: formatPrice(discount.toString()),
      total: formatPrice(total.toString()),
      hasDiscount: discount !== 0,
    };
  };

  const renderItem = (item: IShoppingListItem) => {
    const productId = item.relationships.product.data.id;
    const product = products.get(productId);
    if (!product) return null;

    const imageUrl = getProductImage(product);

    const currentUnitId = getCurrentUnit(item.id);
    const currentQuantity = getCurrentQuantity(item.id);

    const availableUnits = getAvailableUnits(product);

    const selectedUnit =
      availableUnits.find(u => u.id === currentUnitId) || units.get(currentUnitId);

    const { unitPrice, subTotal } = getPriceForUnit(product, currentUnitId, currentQuantity);

    const hasDiscount = item.attributes.discount && parseFloat(item.attributes.discount) !== 0;
    const originalSubTotal = item.attributes.subTotal
      ? formatPrice(item.attributes.subTotal)
      : null;
    const totalValue = item.attributes.totalValue ? formatPrice(item.attributes.totalValue) : null;
    const discount = item.attributes.discount ? formatPrice(item.attributes.discount) : null;

    const renderUnitSelector = () => {
      if (availableUnits.length === 0) return null;

      if (availableUnits.length === 1) {
        // Single unit - display as text
        return (
          <Text style={styles.singleUnitText}>
            Unit: {availableUnits[0].label || availableUnits[0].code}
          </Text>
        );
      } else if (availableUnits.length === 2) {
        // Two units - display as tabs
        return (
          <View style={styles.unitTabsContainer}>
            {availableUnits.map(unit => (
              <TouchableOpacity
                key={unit.id}
                style={[styles.unitTab, unit.id === currentUnitId && styles.unitTabSelected]}
                onPress={() => handleUnitChange(item.id, unit.id)}
              >
                <Text
                  style={[
                    styles.unitTabText,
                    unit.id === currentUnitId && styles.unitTabTextSelected,
                  ]}
                >
                  {unit.label || unit.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      } else {
        // 3+ units - display as dropdown
        if (Platform.OS === 'web') {
          return (
            <View style={styles.unitPickerContainer}>
              <select
                value={currentUnitId}
                onChange={(e: any) => handleUnitChange(item.id, e.target.value)}
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
                  <option key={unit.id} value={unit.id}>
                    {unit.label || unit.code}
                  </option>
                ))}
              </select>
            </View>
          );
        } else {
          const selectedUnitLabel =
            availableUnits.find(u => u.id === currentUnitId)?.label || currentUnitId;

          return (
            <TouchableOpacity
              style={styles.unitPickerButton}
              onPress={() => setShowUnitModalForItem(item.id)}
            >
              <Text style={styles.unitPickerButtonText}>{selectedUnitLabel}</Text>
              <Text style={styles.unitPickerArrow}>▼</Text>
            </TouchableOpacity>
          );
        }
      }
    };

    const isModified = changedQuantities.has(item.id) || changedUnits.has(item.id);

    return (
      <View
        key={item.id}
        style={[styles.itemCard, isModified && styles.itemCardModified]}
        onStartShouldSetResponder={() => false}
        onMoveShouldSetResponder={() => false}
      >
        {/* 3-Dot Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setOpenMenuItemId(openMenuItemId === item.id ? null : item.id)}
        >
          <MoreHorizontal size={18} color={ShopColors.textSecondary} />
        </TouchableOpacity>

        {/* Dropdown Menu (no modal, no overlay) */}
        {openMenuItemId === item.id && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setOpenMenuItemId(null);
                handleRemoveItem(item.id);
              }}
            >
              <Trash2 size={18} color={ShopColors.primary} />
              <Text style={styles.menuItemText}>Remove</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setOpenMenuItemId(null);
                handleAddToWishlist(productId);
              }}
            >
              <Heart
                size={18}
                color={isInWishlist(productId) ? ShopColors.error : ShopColors.textSecondary}
                fill={isInWishlist(productId) ? ShopColors.error : 'none'}
              />
              <Text style={styles.menuItemText}>
                {isInWishlist(productId) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={styles.itemMainContent}
          pointerEvents="box-none"
          onStartShouldSetResponder={() => false}
          onMoveShouldSetResponder={() => false}
        >
          {/* Product Image */}
          <View
            style={styles.imageContainer}
            pointerEvents="none"
            onStartShouldSetResponder={() => false}
            onMoveShouldSetResponder={() => false}
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.itemImage}
                resizeMode="cover"
                onError={() => {}}
              />
            ) : (
              <View style={[styles.itemImage, styles.placeholderImage]} pointerEvents="none">
                <ShoppingCart size={40} color={ShopColors.textSecondary} />
              </View>
            )}
          </View>

          {/* Product Info */}
          <View
            style={styles.itemDetails}
            pointerEvents="box-none"
            onStartShouldSetResponder={() => false}
            onMoveShouldSetResponder={() => false}
          >
            <TouchableOpacity
              onPress={() => router.push(`/product/${productId}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.itemName} numberOfLines={2}>
                {product.attributes.name}
              </Text>
            </TouchableOpacity>

            <View style={styles.skuRow}>
              {product.attributes.inventory_status && (
                <View style={styles.inventoryDotContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      setShowInventoryStatusForItem(
                        showInventoryStatusForItem === item.id ? null : item.id
                      )
                    }
                    style={styles.inventoryDotButton}
                  >
                    <View
                      style={[
                        styles.inventoryDot,
                        {
                          backgroundColor: getInventoryDotColor(
                            product.attributes.inventory_status
                          ),
                        },
                      ]}
                    />
                  </TouchableOpacity>

                  {/* Inventory Status Popover */}
                  {showInventoryStatusForItem === item.id && (
                    <View
                      style={[
                        styles.inventoryStatusPopover,
                        {
                          backgroundColor: ShopColors.cardBackground,
                          borderColor: getInventoryDotColor(product.attributes.inventory_status),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.inventoryStatusText,
                          { color: getInventoryDotColor(product.attributes.inventory_status) },
                        ]}
                      >
                        {product.attributes.inventory_status}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.itemSku}>SKU: {product.attributes.sku}</Text>
            </View>

            {/* Quantity and Unit Selector Row */}
            <View style={styles.quantityAndUnitRow}>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(item.id, currentQuantity - 1)}
                  disabled={currentQuantity <= 1}
                >
                  <Minus
                    size={16}
                    color={currentQuantity <= 1 ? ShopColors.border : ShopColors.text}
                  />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{currentQuantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(item.id, currentQuantity + 1)}
                >
                  <Plus size={16} color={ShopColors.text} />
                </TouchableOpacity>
              </View>

              {/* Unit Selector */}
              <View style={styles.unitSelectorWrapper}>{renderUnitSelector()}</View>
            </View>

            {item.attributes.notes && (
              <View style={styles.itemNotesContainer}>
                <Text style={styles.itemNotes} numberOfLines={2}>
                  {item.attributes.notes}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Full-width Pricing Section */}
        <View
          style={styles.pricingSection}
          pointerEvents="box-none"
          onStartShouldSetResponder={() => false}
          onMoveShouldSetResponder={() => false}
        >
          {/* Unit Price with Info Icon */}
          {selectedUnit && (
            <View style={styles.unitPriceRow}>
              <Text style={styles.priceLabel}>Price:</Text>
              <View style={styles.unitPriceWithInfo}>
                <Text style={styles.itemUnitPrice}>
                  {unitPrice
                    ? `$${parseFloat(unitPrice).toFixed(effectiveConfig.price.precision)} / ${getUnitLabel(selectedUnit)}`
                    : 'N/A'}
                </Text>
                {availableUnits.length >= 1 && (
                  <TouchableOpacity
                    style={styles.priceInfoButton}
                    onPress={() =>
                      setShowPriceInfoForItem(showPriceInfoForItem === item.id ? null : item.id)
                    }
                  >
                    <Info size={16} color={ShopColors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Price Info Popover */}
          {showPriceInfoForItem === item.id && (
            <View style={styles.priceInfoPopover}>
              <View style={styles.priceInfoHeader}>
                <Text style={styles.priceInfoTitle}>Price Details</Text>
                <TouchableOpacity onPress={() => setShowPriceInfoForItem(null)}>
                  <X size={16} color={ShopColors.textSecondary} />
                </TouchableOpacity>
              </View>
              {(() => {
                const pricesByUnit = getAllPricesByUnit(product);
                if (pricesByUnit.size === 0) {
                  return (
                    <Text style={styles.priceInfoNoData}>No pricing information available</Text>
                  );
                }

                // Convert to the format expected by TierPricesTable
                const tierPrices: any[] = [];
                pricesByUnit.forEach((prices, unitCode) => {
                  prices.forEach(tier => {
                    tierPrices.push({
                      price: tier.price,
                      currencyId: 'USD', // Default to USD, update if you have currency info
                      quantity: tier.quantity,
                      unit: units.get(unitCode)?.attributes.label || unitCode,
                    });
                  });
                });

                return (
                  <TierPricesTable prices={tierPrices} title="" compact={true} noBorder={true} />
                );
              })()}
            </View>
          )}

          {/* Discount */}
          {hasDiscount && discount && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>Discount:</Text>
              <Text style={styles.discountValue}>{formatDiscount(discount)}</Text>
            </View>
          )}

          {/* Subtotal */}
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal:</Text>
            {hasDiscount && totalValue ? (
              <View style={styles.priceWithDiscountContainer}>
                <Text style={styles.itemPriceStrikethrough}>
                  {originalSubTotal || subTotal ? `$${originalSubTotal || subTotal}` : 'N/A'}
                </Text>
                <Text style={styles.itemPrice}>${totalValue}</Text>
              </View>
            ) : subTotal || originalSubTotal || totalValue ? (
              <Text style={styles.itemPrice}>${subTotal || originalSubTotal || totalValue}</Text>
            ) : (
              <Text style={styles.itemPrice}>N/A</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/(tabs)/shopping-lists')}
            >
              <ArrowLeft size={24} color={ShopColors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{shoppingListName}</Text>
            <View style={styles.backButton} />
          </View>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={ShopColors.primary} />
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/(tabs)/shopping-lists')}
            >
              <ArrowLeft size={24} color={ShopColors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{shoppingListName}</Text>
            <View style={styles.backButton} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/shopping-lists')}
          >
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>

          {isEditingName ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                autoFocus
                placeholder="Shopping list name"
                maxLength={50}
              />
            </View>
          ) : (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {shoppingListName}
            </Text>
          )}

          <View style={styles.headerActions}>
            {isEditingName ? (
              <>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleCancelEditName}
                  disabled={isUpdating}
                >
                  <X size={20} color={ShopColors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleSaveName}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={ShopColors.primary} />
                  ) : (
                    <Check size={20} color={ShopColors.primary} />
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.headerMenuContainer}>
                <TouchableOpacity
                  style={styles.headerMenuButton}
                  onPress={() => setShowHeaderMenu(!showHeaderMenu)}
                >
                  <MoreVertical size={18} color={ShopColors.textSecondary} />
                </TouchableOpacity>

                {/* Header Dropdown Menu */}
                {showHeaderMenu && (
                  <View style={styles.headerMenuDropdown}>
                    <TouchableOpacity
                      style={styles.headerMenuItem}
                      onPress={() => {
                        setShowHeaderMenu(false);
                        handleStartEditName();
                      }}
                    >
                      <Edit2 size={18} color={ShopColors.textSecondary} />
                      <Text style={styles.headerMenuItemText}>Edit Name</Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity style={styles.headerMenuItem} onPress={handleStartEditNote}>
                      <FilePlus size={18} color={ShopColors.textSecondary} />
                      <Text style={styles.headerMenuItemText}>
                        {shoppingListNote ? 'Edit Note' : 'Add Note'}
                      </Text>
                    </TouchableOpacity>

                    {!isDefaultList && (
                      <>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                          style={styles.headerMenuItem}
                          onPress={handleSetAsDefault}
                          disabled={isUpdating}
                        >
                          <Check size={18} color={ShopColors.success} />
                          <Text style={styles.headerMenuItemText}>Set as Default</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.headerMenuItem}
                      onPress={() => {
                        setShowHeaderMenu(false);
                        handleDeleteClick();
                      }}
                    >
                      <Trash2 size={18} color={ShopColors.error} />
                      <Text style={styles.headerMenuItemText}>Delete List</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            // Add padding when footer is present (either update buttons or order summary)
            (changedQuantities.size > 0 || changedUnits.size > 0 || items.length > 0) &&
              styles.contentContainerWithFooter,
          ]}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          bounces={true}
          alwaysBounceVertical={false}
          scrollEventThrottle={16}
          directionalLockEnabled={false}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => {
            // Close any open menus when scrolling starts
            setShowHeaderMenu(false);
            setOpenMenuItemId(null);
            setShowPriceInfoForItem(null);
            setShowInventoryStatusForItem(null);
          }}
        >
          {items.length === 0 ? (
            <View style={styles.emptyStateWrapper}>
              <View style={styles.emptyContainer}>
                <ShoppingCart size={64} color={ShopColors.textSecondary} />
                <Text style={styles.emptyTitle}>No Items Yet</Text>
                <Text style={styles.emptyText}>
                  Your shopping list is empty. Add products to get started.
                </Text>
              </View>
              <MainMenu activeTab="/(tabs)/shopping-lists" />
            </View>
          ) : (
            <View style={styles.itemsList} pointerEvents="box-none">
              <Text style={styles.itemsCount} pointerEvents="none">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
              {shoppingListNote ? (
                <View style={styles.noteContainer} pointerEvents="none">
                  <Text style={styles.noteLabel} pointerEvents="none">
                    Note:
                  </Text>
                  <Text style={styles.noteText} pointerEvents="none">
                    {shoppingListNote}
                  </Text>
                </View>
              ) : null}
              {items.map(renderItem)}
            </View>
          )}
        </ScrollView>

        {(changedQuantities.size > 0 || changedUnits.size > 0) && (
          <View
            style={[styles.updateButtonContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}
          >
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetQuantities}
                disabled={isUpdatingQuantities}
              >
                <X size={18} color={ShopColors.text} />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateQuantities}
                disabled={isUpdatingQuantities}
              >
                {isUpdatingQuantities ? (
                  <ActivityIndicator size="small" color={ShopColors.cardBackground} />
                ) : (
                  <>
                    <Check size={20} color={ShopColors.cardBackground} />
                    <Text style={styles.updateButtonText}>
                      Update ({new Set([...changedQuantities.keys(), ...changedUnits.keys()]).size})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Shopping List Details - shown when no unsaved changes */}
        {changedQuantities.size === 0 &&
          changedUnits.size === 0 &&
          items.length > 0 &&
          (() => {
            const totals = calculateShoppingListTotals();
            return (
              <View
                style={[
                  styles.orderSummaryContainer,
                  { paddingBottom: Math.max(insets.bottom, 12) },
                ]}
              >
                <View style={styles.orderSummaryLeft}>
                  <View style={styles.orderTotalRow}>
                    <Text style={styles.orderTotalLabel}>Order Total</Text>
                    <TouchableOpacity
                      onPress={() => setShowOrderSummary(!showOrderSummary)}
                      style={styles.infoIconButton}
                    >
                      <Info size={16} color={ShopColors.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.orderTotalValue}>${totals.total}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                  <Text style={styles.checkoutButtonText}>Checkout</Text>
                </TouchableOpacity>
              </View>
            );
          })()}

        {/* Note Edit Modal */}
        <Modal
          visible={isEditingNote}
          transparent
          animationType="fade"
          onRequestClose={handleCancelEditNote}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCancelEditNote}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{shoppingListNote ? 'Edit Note' : 'Add Note'}</Text>
                <TouchableOpacity onPress={handleCancelEditNote}>
                  <X size={24} color={ShopColors.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.noteInput}
                value={editedNote}
                onChangeText={setEditedNote}
                placeholder="Add a note to your shopping list..."
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                autoFocus
              />

              <View style={styles.modalFooter}>
                {shoppingListNote ? (
                  <TouchableOpacity
                    style={styles.modalRemoveButton}
                    onPress={handleRemoveNote}
                    disabled={isUpdating}
                  >
                    <Trash2 size={16} color={ShopColors.error} />
                    <Text style={styles.modalRemoveText}>Remove</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.modalRightButtons}>
                  <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancelEditNote}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleSaveNote}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={ShopColors.cardBackground} />
                    ) : (
                      <Text style={styles.modalSaveText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <CustomAlert
          visible={showDeleteConfirm}
          title="Delete Shopping List"
          message={`Are you sure you want to delete "${shoppingListName}"? This action cannot be undone.`}
          type="warning"
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConfirm}
        />

        <CustomAlert
          visible={!!itemToRemove}
          title="Remove Item"
          message="Are you sure you want to remove this item from the shopping list?"
          type="warning"
          confirmText={isRemovingItem ? 'Removing...' : 'Remove'}
          cancelText="Cancel"
          onClose={() => setItemToRemove(null)}
          onConfirm={confirmRemoveItem}
        />

        {/* Unit Selection Modal for Native Platforms */}
        {showUnitModalForItem &&
          Platform.OS !== 'web' &&
          (() => {
            const item = items.find(i => i.id === showUnitModalForItem);
            if (!item) return null;

            const productId = item.relationships.product.data.id;
            const product = products.get(productId);
            if (!product) return null;

            const currentUnitId = getCurrentUnit(item.id);
            const availableUnits = getAvailableUnits(product);

            return (
              <Modal
                visible={true}
                transparent
                animationType="fade"
                onRequestClose={() => setShowUnitModalForItem(null)}
              >
                <Pressable
                  style={styles.modalOverlay}
                  onPress={() => setShowUnitModalForItem(null)}
                >
                  <Pressable style={styles.unitModalContent} onPress={e => e.stopPropagation()}>
                    <Text style={styles.unitModalTitle}>Select Unit</Text>
                    {availableUnits.map(unit => (
                      <TouchableOpacity
                        key={unit.id}
                        style={[
                          styles.unitModalOption,
                          unit.id === currentUnitId && styles.unitModalOptionSelected,
                        ]}
                        onPress={() => {
                          handleUnitChange(item.id, unit.id);
                          setShowUnitModalForItem(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.unitModalOptionText,
                            unit.id === currentUnitId && styles.unitModalOptionTextSelected,
                          ]}
                        >
                          {unit.label || unit.code}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Pressable>
                </Pressable>
              </Modal>
            );
          })()}

        {/* Order Summary Modal */}
        {showOrderSummary &&
          (() => {
            const totals = calculateShoppingListTotals();
            return (
              <Modal
                visible={true}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOrderSummary(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setShowOrderSummary(false)}>
                  <Pressable style={styles.orderSummaryModal} onPress={e => e.stopPropagation()}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Order Summary</Text>
                      <TouchableOpacity onPress={() => setShowOrderSummary(false)}>
                        <X size={24} color={ShopColors.text} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.summaryDetails}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Items:</Text>
                        <Text style={styles.summaryValue}>{totals.itemCount}</Text>
                      </View>

                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal:</Text>
                        <Text style={styles.summaryValue}>${totals.subtotal}</Text>
                      </View>

                      {totals.hasDiscount && (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Discount:</Text>
                          <Text style={[styles.summaryValue, styles.discountText]}>
                            {formatDiscount(totals.discount)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.summaryDivider} />

                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabelBold}>Total:</Text>
                        <Text style={styles.summaryValueBold}>${totals.total}</Text>
                      </View>
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
            );
          })()}
      </View>
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
    zIndex: 100,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
    flex: 1,
    paddingHorizontal: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 40,
  },
  headerMenuContainer: {
    position: 'relative',
  },
  headerMenuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  headerMenuDropdown: {
    position: 'absolute',
    top: 42,
    right: 0,
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    minWidth: 180,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: ShopColors.border,
    zIndex: 200,
  },
  headerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  headerMenuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: ShopColors.text,
  },
  contentPressable: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  contentContainerWithFooter: {
    paddingBottom: 100, // Space for the footer (update buttons or order summary)
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
    borderBottomWidth: 2,
    borderBottomColor: ShopColors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: ShopColors.textSecondary,
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
    color: ShopColors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  itemsList: {
    padding: 16,
    paddingBottom: 32, // Extra padding at bottom for last item
  },
  itemsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'visible',
    borderWidth: 1,
    borderColor: ShopColors.border,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  itemCardModified: {
    borderColor: ShopColors.primary,
    borderWidth: 2,
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 16,
    zIndex: 50,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  menuDropdown: {
    position: 'absolute',
    top: 44,
    right: 8,
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    minWidth: 200,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: ShopColors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: ShopColors.border,
  },
  itemMainContent: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 16,
    overflow: 'visible',
  },
  imageContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 6,
  },
  placeholderImage: {
    backgroundColor: ShopColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 6,
    lineHeight: 22,
    flexShrink: 1,
    paddingRight: 48,
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    zIndex: 500,
  },
  inventoryDotContainer: {
    position: 'relative',
    marginRight: 8,
    zIndex: 1000,
  },
  inventoryDotButton: {
    padding: 2,
    zIndex: 1001,
  },
  inventoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inventoryStatusPopover: {
    position: 'absolute',
    top: 22,
    left: -4,
    borderRadius: 6,
    padding: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'transparent', // Border color set dynamically
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 15,
    zIndex: 10000,
    minWidth: 120,
  },
  inventoryStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemSku: {
    fontSize: 13,
    color: ShopColors.textSecondary,
  },
  quantityAndUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    zIndex: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unitSelectorWrapper: {
    maxWidth: 320,
    flex: 1,
  },
  unitPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ShopColors.text,
  },
  skuStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  availabilityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'center',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemQuantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
    marginRight: 2,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 15,
    fontWeight: '700',
    color: ShopColors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
  },
  itemUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.primary,
    backgroundColor: ShopColors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemUnitPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: ShopColors.textSecondary,
  },
  unitPriceWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceInfoButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: ShopColors.primary + '15',
  },
  priceInfoPopover: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: ShopColors.border,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  priceInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  priceInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ShopColors.text,
  },
  priceInfoUnitSection: {
    marginBottom: 12,
  },
  priceInfoUnitLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ShopColors.primary,
    marginBottom: 6,
  },
  priceInfoTierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: ShopColors.background,
    borderRadius: 4,
    marginBottom: 4,
  },
  priceInfoTierQty: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.textSecondary,
  },
  priceInfoTierPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: ShopColors.text,
  },
  priceInfoNoData: {
    fontSize: 13,
    color: ShopColors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  // Unit selector styles
  singleUnitText: {
    fontSize: 13,
    fontWeight: '600',
    color: ShopColors.textSecondary,
  },
  unitTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  unitTab: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.border,
    flex: 1,
    alignItems: 'center',
  },
  unitTabSelected: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  unitTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.text,
  },
  unitTabTextSelected: {
    color: ShopColors.cardBackground,
  },
  unitPickerContainer: {
    flex: 1,
  },
  unitPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    backgroundColor: ShopColors.background,
  },
  unitPickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
  },
  unitPickerArrow: {
    fontSize: 10,
    color: ShopColors.textSecondary,
  },
  unitModalContent: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    maxWidth: 300,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  unitModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 12,
  },
  unitModalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  unitModalOptionSelected: {
    backgroundColor: ShopColors.primary + '20',
  },
  unitModalOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: ShopColors.text,
  },
  unitModalOptionTextSelected: {
    color: ShopColors.primary,
    fontWeight: '700',
  },
  subtotalContainer: {
    marginBottom: 8,
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
  },
  priceWithDiscountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.primary,
  },
  itemPriceStrikethrough: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  discountLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: ShopColors.textSecondary,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.success, // Green for discount
  },
  unitsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
  },
  unitsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    marginBottom: 4,
  },
  unitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  unitBadgeSelected: {
    backgroundColor: ShopColors.primary + '20',
    borderColor: ShopColors.primary,
  },
  unitBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: ShopColors.textSecondary,
  },
  unitBadgeTextSelected: {
    color: ShopColors.primary,
  },
  itemNotesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
  },
  itemNotes: {
    fontSize: 13,
    color: ShopColors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  updateButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: ShopColors.cardBackground,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    backgroundColor: ShopColors.cardBackground,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: ShopColors.border,
    minWidth: 100,
  },
  resetButtonText: {
    color: ShopColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: ShopColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  updateButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 16,
    fontWeight: '700',
  },
  noteContainer: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: ShopColors.text,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    padding: 20,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: ShopColors.text,
    minHeight: 120,
    maxHeight: 200,
    backgroundColor: ShopColors.background,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  modalRightButtons: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 'auto',
  },
  modalRemoveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: ShopColors.cardBackground,
    borderWidth: 1,
    borderColor: ShopColors.error,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalRemoveText: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.error,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.text,
  },
  modalSaveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: ShopColors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: ShopColors.cardBackground,
  },
  pricingSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
  },
  // Order Summary Container
  orderSummaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: ShopColors.cardBackground,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: ShopColors.primary,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderSummaryLeft: {
    flex: 1,
  },
  orderTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  orderTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.textSecondary,
  },
  infoIconButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: ShopColors.text,
  },
  checkoutButton: {
    backgroundColor: ShopColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  checkoutButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 16,
    fontWeight: '700',
  },
  // Order Summary Modal
  orderSummaryModal: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  summaryDetails: {
    marginTop: 8,
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
  summaryLabelBold: {
    fontSize: 17,
    color: ShopColors.text,
    fontWeight: '700',
  },
  summaryValueBold: {
    fontSize: 20,
    color: ShopColors.text,
    fontWeight: '700',
  },
  discountText: {
    color: ShopColors.success,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: ShopColors.border,
    marginVertical: 8,
  },
});
