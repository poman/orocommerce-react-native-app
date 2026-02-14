import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Check,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Info,
  X,
} from '@/src/libs/Icon';
import { ShopColors } from '@/src/constants/theme';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import {
  getCustomerAddresses,
  createCustomerAddress,
  updateCheckoutBillingAddressFromCustomer,
  updateCheckoutShippingAddressFromCustomer,
  updateCheckoutShippingMethod,
  updateCheckoutPaymentMethod,
  executeCheckoutPayment,
  getAvailableShippingMethods,
  getAvailablePaymentMethods,
  getCountries,
  getRegions,
  ICheckout,
  ICheckoutLineItem,
  ICustomerAddress,
} from '@/src/api/helpers/checkout';
import {
  getShoppingListItems,
  createCheckoutFromShoppingList,
} from '@/src/api/helpers/shoppingLists';
import { formatPrice } from '@/src/utils/priceFormatter';
import { showToast } from '@/src/utils/toast';
import { TopMainMenu } from '@/src/components/TopMainMenu';

// Storage key for checkout state persistence
const CHECKOUT_STATE_KEY = 'checkout_state_';

// Helper functions for state persistence
const saveCheckoutState = async (shoppingListId: string, state: any) => {
  try {
    const stateToSave = {
      ...state,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(
      `${CHECKOUT_STATE_KEY}${shoppingListId}`,
      JSON.stringify(stateToSave)
    );
  } catch (error) {
    console.error('❌ Error saving checkout state:', error);
  }
};

const loadCheckoutState = async (shoppingListId: string) => {
  try {
    const savedState = await AsyncStorage.getItem(`${CHECKOUT_STATE_KEY}${shoppingListId}`);
    if (savedState) {
      const parsed = JSON.parse(savedState);

      // Check if state is not too old (24 hours)
      const stateAge = Date.now() - (parsed.timestamp || 0);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (stateAge > maxAge) {
        await clearCheckoutState(shoppingListId);
        return null;
      }

      return parsed;
    }
    return null;
  } catch (error) {
    console.error('❌ Error loading checkout state:', error);
    return null;
  }
};

const clearCheckoutState = async (shoppingListId: string) => {
  try {
    await AsyncStorage.removeItem(`${CHECKOUT_STATE_KEY}${shoppingListId}`);
  } catch (error) {
    console.error('❌ Error clearing checkout state:', error);
  }
};

export default function CheckoutScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { baseUrl } = useConfig();
  const { getValidAccessToken } = useAuth();
  const insets = useSafeAreaInsets();

  // Ref to prevent multiple initializations
  const initializedRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<ICheckout | null>(null);
  const [lineItems, setLineItems] = useState<ICheckoutLineItem[]>([]);
  const [_shoppingListName, _setShoppingListName] = useState<string>(name || 'Shopping List');
  const [sourceId, setSourceId] = useState<string | null>(null);

  // Product data for rich display
  const [products, setProducts] = useState<Map<string, any>>(new Map());
  const [images, setImages] = useState<Map<string, any>>(new Map());
  const [units, setUnits] = useState<Map<string, any>>(new Map());

  // Address state
  const [addresses, setAddresses] = useState<ICustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout step state
  const [currentStep, setCurrentStep] = useState<
    'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'
  >('billing');

  // Step completion tracking - tracks which steps have been completed
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Store the furthest step reached to prevent skipping
  const [furthestStepReached, setFurthestStepReached] = useState<
    'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'
  >('billing');

  // Line items visibility state (collapsed by default)
  const [lineItemsExpanded, setLineItemsExpanded] = useState(false);
  const [showOrderSummaryModal, setShowOrderSummaryModal] = useState(false);
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
  const [regions, setRegions] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [shippingAddressId, setShippingAddressId] = useState<string | null>(null);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [showNewShippingAddressForm, setShowNewShippingAddressForm] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string | null>(null);
  const [loadingShippingMethods, setLoadingShippingMethods] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  const [newAddress, setNewAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    street2: '',
    city: '',
    postalCode: '',
    region: '',
    country: '',
    phone: '',
    label: '',
  });

  const [newShippingAddress, setNewShippingAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    street2: '',
    city: '',
    postalCode: '',
    region: '',
    country: '',
    phone: '',
    label: '',
  });

  useEffect(() => {
    const initializeCheckoutPage = async () => {
      if (!id || !baseUrl) return;

      if (initializedRef.current && currentIdRef.current === id) {
        return;
      }

      if (currentIdRef.current !== id) {
        initializedRef.current = false;
        currentIdRef.current = id;
      }

      if (initializedRef.current) {
        return;
      }

      initializedRef.current = true;

      try {
        setLoading(true);

        initializeApi(baseUrl);
        setAuthTokenGetter(getValidAccessToken);

        const shoppingListId = id;
        setSourceId(shoppingListId);

        const slResult = await getShoppingListItems({
          shoppingListId: shoppingListId,
          page: { number: 1, size: 100 },
          include: 'product,product.images,product.inventoryStatus,unit',
        });

        if (!slResult.data || slResult.data.length === 0) {
          showToast('Shopping list is empty', 'error');
          setLoading(false);
          return;
        }

        const productsMap = new Map();
        const imagesMap = new Map();
        const unitsMap = new Map();

        if (slResult.included) {
          slResult.included.forEach((item: any) => {
            if (item.type === 'products') {
              productsMap.set(item.id, item);
            } else if (item.type === 'productimages') {
              imagesMap.set(item.id, item);
            } else if (item.type === 'productunits') {
              unitsMap.set(item.id, item);
            }
          });
        }

        setProducts(productsMap);
        setImages(imagesMap);
        setUnits(unitsMap);

        const lineItemsData = slResult.data.map((slItem: any) => {
          const product = productsMap.get(slItem.relationships.product.data.id);
          const unit = unitsMap.get(slItem.relationships.unit.data.id);

          return {
            id: slItem.id,
            type: 'checkoutlineitems',
            attributes: {
              quantity: slItem.attributes.quantity,
              productSku: product?.attributes?.sku,
              productName: product?.attributes?.name,
              productUnitCode: unit?.attributes?.code,
              productUnitLabel: unit?.attributes?.label,
              inventoryStatus: product?.attributes?.inventory_status,
              price: slItem.attributes.value || '0',
              subTotal: slItem.attributes.subTotal || '0',
              totalValue: slItem.attributes.totalValue || '0',
              discount: slItem.attributes.discount || '0',
            },
            relationships: {
              product: slItem.relationships.product,
              productUnit: slItem.relationships.unit,
            },
          };
        });

        setLineItems(lineItemsData);

        const checkoutResult = await createCheckoutFromShoppingList(shoppingListId);

        if (checkoutResult.error || !checkoutResult.data) {
          console.error('❌ Failed to create checkout:', checkoutResult.error);
          showToast(checkoutResult.error || 'Failed to create checkout', 'error');
          setLoading(false);
          return;
        }

        const createdCheckout = checkoutResult.data;
        setCheckout(createdCheckout);

        const addressesResult = await getCustomerAddresses();
        if (addressesResult.data) {
          setAddresses(addressesResult.data);

          const primaryAddress = addressesResult.data.find(addr => addr.attributes.primary);
          if (primaryAddress) {
            setSelectedAddressId(primaryAddress.id);
          }

          if (addressesResult.data.length === 0) {
            setShowNewAddressForm(true);
          }
        }

        const countriesResult = await getCountries();
        if (countriesResult.data) {
          setCountries(countriesResult.data);
        }

        const savedState = await loadCheckoutState(shoppingListId);
        if (savedState) {
          if (savedState.currentStep) {
            setCurrentStep(savedState.currentStep);
          }

          if (savedState.completedSteps && Array.isArray(savedState.completedSteps)) {
            const restoredSet = new Set(savedState.completedSteps as string[]);
            setCompletedSteps(restoredSet);
          }

          if (savedState.furthestStepReached) {
            setFurthestStepReached(savedState.furthestStepReached);
          }

          if (savedState.selectedAddressId) {
            setSelectedAddressId(savedState.selectedAddressId);
          }

          if (savedState.shippingAddressId) {
            setShippingAddressId(savedState.shippingAddressId);
          }

          if (savedState.sameAsBilling !== undefined) {
            setSameAsBilling(savedState.sameAsBilling);
          }

          if (savedState.shippingMethods && savedState.shippingMethods.length > 0) {
            setShippingMethods(savedState.shippingMethods);
          }

          if (savedState.selectedShippingMethod) {
            setSelectedShippingMethod(savedState.selectedShippingMethod);
          }

          if (savedState.paymentMethods && savedState.paymentMethods.length > 0) {
            setPaymentMethods(savedState.paymentMethods);
          }

          if (savedState.selectedPaymentMethod) {
            setSelectedPaymentMethod(savedState.selectedPaymentMethod);
          }

          showToast('Progress restored', 'success');
        }

        setLoading(false);
      } catch (err: any) {
        console.error('❌ Error initializing checkout page:', err);
        showToast('Failed to load checkout page', 'error');
        setLoading(false);
        initializedRef.current = false;
      }
    };

    initializeCheckoutPage();
  }, [id, baseUrl, getValidAccessToken]);

  useEffect(() => {
    const fetchRegions = async () => {
      if (!newAddress.country) {
        setRegions([]);
        return;
      }

      setLoadingRegions(true);
      try {
        const regionsResult = await getRegions(newAddress.country);
        if (regionsResult.data) {
          setRegions(regionsResult.data);

          if (newAddress.region && !regionsResult.data.find(r => r.id === newAddress.region)) {
            setNewAddress(prev => ({ ...prev, region: '' }));
          }
        }
      } catch (error) {
        console.error('Error fetching regions:', error);
        setRegions([]);
      } finally {
        setLoadingRegions(false);
      }
    };

    fetchRegions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAddress.country]);

  useEffect(() => {
    if (!id || loading) return;

    const saveState = async () => {
      const stateToSave = {
        currentStep,
        completedSteps: Array.from(completedSteps),
        furthestStepReached,
        selectedAddressId,
        shippingAddressId,
        sameAsBilling,
        selectedShippingMethod,
        selectedPaymentMethod,
        checkoutId: checkout?.id,
        shippingMethods,
        paymentMethods,
      };

      await saveCheckoutState(id, stateToSave);
    };

    const timeoutId = setTimeout(saveState, 500);
    return () => clearTimeout(timeoutId);
  }, [
    id,
    loading,
    currentStep,
    completedSteps,
    furthestStepReached,
    selectedAddressId,
    shippingAddressId,
    sameAsBilling,
    selectedShippingMethod,
    selectedPaymentMethod,
    checkout?.id,
    shippingMethods,
    paymentMethods,
  ]);

  const calculateTotals = () => {
    let subtotal = 0;
    let totalWithDiscount = 0;
    let totalDiscount = 0;
    let itemCount = lineItems.length;

    lineItems.forEach(item => {
      const itemSubtotal = parseFloat(item.attributes.subTotal || '0');
      const itemTotal = parseFloat(item.attributes.totalValue || item.attributes.subTotal || '0');
      const itemDiscount = parseFloat(item.attributes.discount || '0');

      subtotal += itemSubtotal;
      totalWithDiscount += itemTotal;
      totalDiscount += itemDiscount;
    });

    let shippingCost = 0;
    if (selectedShippingMethod && shippingMethods.length > 0) {
      const selectedMethod = shippingMethods.find(m => m.id === selectedShippingMethod);
      if (selectedMethod?.attributes?.types && selectedMethod.attributes.types.length > 0) {
        const primaryType = selectedMethod.attributes.types[0];
        shippingCost = parseFloat(primaryType.shippingCost || '0');
      }
    }

    const finalSubtotal = checkout?.attributes?.subtotal
      ? parseFloat(checkout.attributes.subtotal)
      : subtotal;

    const finalShipping = shippingCost;

    const finalTotal = checkout?.attributes?.total
      ? parseFloat(checkout.attributes.total)
      : totalWithDiscount + finalShipping;

    return {
      itemCount,
      subtotal: formatPrice(finalSubtotal.toString()),
      discount: formatPrice(Math.abs(totalDiscount).toString()),
      shipping: formatPrice(finalShipping.toString()),
      total: formatPrice(finalTotal.toString()),
      hasDiscount: totalDiscount < 0,
      hasShipping: finalShipping > 0,
    };
  };

  const getProductForLineItem = (lineItem: ICheckoutLineItem) => {
    const productId = lineItem.relationships?.product?.data?.id;
    return productId ? products.get(productId) : null;
  };

  const getUnitForLineItem = (lineItem: ICheckoutLineItem) => {
    const unitId = lineItem.relationships?.productUnit?.data?.id;
    return unitId ? units.get(unitId) : null;
  };

  const getUnitName = (lineItem: ICheckoutLineItem): string => {
    if (lineItem.attributes.productUnitLabel) {
      return lineItem.attributes.productUnitLabel;
    }

    if (lineItem.attributes.productUnitCode) {
      const unit = getUnitForLineItem(lineItem);
      return unit?.attributes?.label || lineItem.attributes.productUnitCode;
    }
    return 'unit';
  };

  const getProductImage = (product: any): string | null => {
    if (!product || !baseUrl) return null;

    const imageRefs = product.relationships?.images?.data;
    if (!imageRefs || imageRefs.length === 0) return null;

    const imageId = imageRefs[0].id;
    const imageData = images.get(imageId);

    if (!imageData) return null;

    let imageUrl = null;
    if (imageData.attributes?.files && imageData.attributes.files.length > 0) {
      imageUrl = imageData.attributes.files[0].url;
    } else if (imageData.attributes?.url) {
      imageUrl = imageData.attributes.url;
    }

    if (!imageUrl) return null;

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

  const handleCreateNewAddress = async () => {
    if (
      !newAddress.firstName ||
      !newAddress.lastName ||
      !newAddress.street ||
      !newAddress.city ||
      !newAddress.postalCode ||
      !newAddress.country
    ) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (regions.length > 0 && !newAddress.region) {
      showToast('Please select a state/region', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await createCustomerAddress(newAddress);

      if (result.error) {
        showToast(result.error, 'error');
        return;
      }

      if (result.data) {
        setAddresses([...addresses, result.data]);
        setSelectedAddressId(result.data.id);
        setShowNewAddressForm(false);
        showToast('Address created successfully', 'success');

        setNewAddress({
          firstName: '',
          lastName: '',
          street: '',
          street2: '',
          city: '',
          postalCode: '',
          region: '',
          country: '',
          phone: '',
          label: '',
        });
      }
    } catch (err: any) {
      console.error('Error creating address:', err);
      showToast('Failed to create address', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryShippingMethods = async () => {
    if (!checkout) {
      showToast('Checkout not initialized', 'error');
      return;
    }

    try {
      setLoadingShippingMethods(true);

      const shippingMethodsResult = await getAvailableShippingMethods(checkout.id);

      if (shippingMethodsResult.error) {
        console.error('❌ Error fetching shipping methods:', shippingMethodsResult.error);
        showToast(shippingMethodsResult.error || 'Failed to load shipping methods', 'error');
        setShippingMethods([]);
      } else if (shippingMethodsResult.data) {
        setShippingMethods(shippingMethodsResult.data);

        if (shippingMethodsResult.data.length > 0) {
          setSelectedShippingMethod(shippingMethodsResult.data[0].id);
          showToast('Shipping methods loaded successfully', 'success');
        } else {
          showToast('No shipping methods available', 'info');
        }
      }
    } catch (err: any) {
      console.error('❌ Error retrying shipping methods:', err);
      showToast('Failed to load shipping methods', 'error');
    } finally {
      setLoadingShippingMethods(false);
    }
  };

  const handleContinue = async () => {
    try {
      setIsSubmitting(true);

      if (currentStep === 'billing') {
        if (!checkout) {
          showToast('Checkout not initialized', 'error');
          setIsSubmitting(false);
          return;
        }

        if (!selectedAddressId) {
          showToast('Please select or create a billing address', 'error');
          setIsSubmitting(false);
          return;
        }

        const billingAddr = addresses.find(a => a.id === selectedAddressId);
        if (!billingAddr) {
          showToast('Address not found', 'error');
          setIsSubmitting(false);
          return;
        }

        const updateResult = await updateCheckoutBillingAddressFromCustomer({
          checkoutId: checkout.id,
          customerAddressId: selectedAddressId,
          addressData: billingAddr,
        });

        if (updateResult.error || !updateResult.data) {
          showToast(updateResult.error || 'Failed to update billing address', 'error');
          setIsSubmitting(false);
          return;
        }

        setCheckout(updateResult.data);

        markStepCompleted('billing');

        const stepOrder: Array<'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'> =
          ['billing', 'shipping', 'shipping-method', 'payment', 'review'];
        const shippingIndex = stepOrder.indexOf('shipping');
        const furthestIndex = stepOrder.indexOf(furthestStepReached);
        if (shippingIndex > furthestIndex) {
          setFurthestStepReached('shipping');
        }

        showToast('Billing address saved', 'success');
        setCurrentStep('shipping');
      } else if (currentStep === 'shipping') {
        if (!checkout) {
          showToast('Checkout not initialized', 'error');
          setIsSubmitting(false);
          return;
        }

        const shippingAddrId = sameAsBilling ? selectedAddressId : shippingAddressId;

        if (!shippingAddrId) {
          showToast('Please select or create a shipping address', 'error');
          setIsSubmitting(false);
          return;
        }

        const shippingAddr = addresses.find(a => a.id === shippingAddrId);

        if (!shippingAddr) {
          showToast('Address not found', 'error');
          setIsSubmitting(false);
          return;
        }

        const updateResult = await updateCheckoutShippingAddressFromCustomer({
          checkoutId: checkout.id,
          customerAddressId: shippingAddrId,
          addressData: shippingAddr,
        });

        if (updateResult.error || !updateResult.data) {
          showToast(updateResult.error || 'Failed to update shipping address', 'error');
          setIsSubmitting(false);
          return;
        }

        setCheckout(updateResult.data);

        setLoadingShippingMethods(true);

        const shippingMethodsResult = await getAvailableShippingMethods(checkout.id);
        setLoadingShippingMethods(false);

        if (shippingMethodsResult.error) {
          console.error('❌ Error fetching shipping methods:', shippingMethodsResult.error);
          showToast('Failed to load shipping methods', 'error');
          setIsSubmitting(false);
          return;
        }

        if (shippingMethodsResult.data) {
          setShippingMethods(shippingMethodsResult.data);

          if (shippingMethodsResult.data.length > 0) {
            setSelectedShippingMethod(shippingMethodsResult.data[0].id);
          }
        }

        markStepCompleted('shipping');

        const stepOrder: Array<'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'> =
          ['billing', 'shipping', 'shipping-method', 'payment', 'review'];
        const methodIndex = stepOrder.indexOf('shipping-method');
        const furthestIndex = stepOrder.indexOf(furthestStepReached);
        if (methodIndex > furthestIndex) {
          setFurthestStepReached('shipping-method');
        }

        showToast('Shipping address saved', 'success');
        setCurrentStep('shipping-method');
      } else if (currentStep === 'shipping-method') {
        if (!checkout) {
          showToast('Checkout not initialized', 'error');
          setIsSubmitting(false);
          return;
        }

        if (!selectedShippingMethod) {
          showToast('Please select a shipping method', 'error');
          setIsSubmitting(false);
          return;
        }

        const updateResult = await updateCheckoutShippingMethod(
          checkout.id,
          selectedShippingMethod
        );

        if (updateResult.error) {
          showToast(updateResult.error, 'error');
          setIsSubmitting(false);
          return;
        }

        if (updateResult.data) {
          setCheckout(updateResult.data);
        }

        setLoadingPaymentMethods(true);
        const paymentMethodsResult = await getAvailablePaymentMethods(checkout.id);
        setLoadingPaymentMethods(false);

        if (paymentMethodsResult.data) {
          setPaymentMethods(paymentMethodsResult.data);
          if (paymentMethodsResult.data.length > 0) {
            if (!selectedPaymentMethod) {
              setSelectedPaymentMethod(paymentMethodsResult.data[0].id);
            }
          }
        }

        // Mark shipping method step as completed
        markStepCompleted('shipping-method');

        // Update furthest step
        const stepOrder: Array<'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'> =
          ['billing', 'shipping', 'shipping-method', 'payment', 'review'];
        const paymentIndex = stepOrder.indexOf('payment');
        const furthestIndex = stepOrder.indexOf(furthestStepReached);
        if (paymentIndex > furthestIndex) {
          setFurthestStepReached('payment');
        }

        showToast('Shipping method saved', 'success');
        setCurrentStep('payment');
      } else if (currentStep === 'payment') {
        if (!checkout) {
          showToast('Checkout not initialized', 'error');
          setIsSubmitting(false);
          return;
        }

        if (!selectedPaymentMethod) {
          showToast('Please select a payment method', 'error');
          setIsSubmitting(false);
          return;
        }

        const updateResult = await updateCheckoutPaymentMethod(checkout.id, selectedPaymentMethod);

        if (updateResult.error) {
          showToast(updateResult.error, 'error');
          setIsSubmitting(false);
          return;
        }

        if (updateResult.data) {
          setCheckout(updateResult.data);
        }

        markStepCompleted('payment');

        const stepOrder: Array<'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'> =
          ['billing', 'shipping', 'shipping-method', 'payment', 'review'];
        const reviewIndex = stepOrder.indexOf('review');
        const furthestIndex = stepOrder.indexOf(furthestStepReached);
        if (reviewIndex > furthestIndex) {
          setFurthestStepReached('review');
        }

        showToast('Payment method saved', 'success');
        setCurrentStep('review');
      } else if (currentStep === 'review') {
        if (!checkout) {
          showToast('Checkout not initialized', 'error');
          setIsSubmitting(false);
          return;
        }

        if (!selectedPaymentMethod) {
          showToast('Payment method not selected', 'error');
          setIsSubmitting(false);
          return;
        }

        const paymentResult = await executeCheckoutPayment(checkout.id, selectedPaymentMethod);

        if (paymentResult.error) {
          showToast(paymentResult.error, 'error');
          setIsSubmitting(false);
          return;
        }

        if (paymentResult.data) {
          const orderData = Array.isArray(paymentResult.data.data)
            ? paymentResult.data.data[0]
            : paymentResult.data.data;

          const orderId = orderData?.id;

          showToast('Order placed successfully!', 'success');

          if (id) {
            await clearCheckoutState(id);
          }

          if (orderId) {
            setTimeout(() => {
              router.push(
                `/thank-you?orderId=${orderId}&orderNumber=${orderData?.attributes?.identifier || orderId}` as any
              );
            }, 1500);
          } else {
            setTimeout(() => {
              router.push('/orders' as any);
            }, 1500);
          }
        }
      }
    } catch (err: any) {
      console.error('Error in checkout step:', err);
      showToast('Failed to process checkout step', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'shipping') {
      setCurrentStep('billing');
    } else if (currentStep === 'shipping-method') {
      setCurrentStep('shipping');
    } else if (currentStep === 'payment') {
      setCurrentStep('shipping-method');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
    } else {
      // Back to shopping list
      if (sourceId) {
        router.push(`/shopping-list/${sourceId}`);
      } else {
        router.back();
      }
    }
  };

  // Navigation to specific step with state preservation
  const handleQuickNav = (
    step: 'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'
  ) => {
    const stepOrder: Array<'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'> = [
      'billing',
      'shipping',
      'shipping-method',
      'payment',
      'review',
    ];
    const targetStepIndex = stepOrder.indexOf(step);
    const furthestStepIndex = stepOrder.indexOf(furthestStepReached);

    // Only allow navigation to steps that have been reached before
    if (targetStepIndex <= furthestStepIndex) {
      setCurrentStep(step);
    } else {
      showToast('Please complete previous steps first', 'warning');
    }
  };

  // Mark a step as completed and update furthest step reached
  const markStepCompleted = (
    step: 'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'
  ) => {
    setCompletedSteps(prev => {
      const updated = new Set(prev);
      updated.add(step);
      return updated;
    });

    // Update furthest step reached
    const stepOrder: Array<'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'> = [
      'billing',
      'shipping',
      'shipping-method',
      'payment',
      'review',
    ];
    const currentIndex = stepOrder.indexOf(step);
    const furthestIndex = stepOrder.indexOf(furthestStepReached);

    if (currentIndex > furthestIndex) {
      setFurthestStepReached(step);
    }
  };

  const isStepCompleted = (
    step: 'billing' | 'shipping' | 'shipping-method' | 'payment' | 'review'
  ): boolean => {
    return completedSteps.has(step);
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (sourceId ? router.push(`/shopping-list/${sourceId}`) : router.back())}
          >
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <TopMainMenu />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ShopColors.primary} />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentStep === 'billing' && 'Billing Information'}
            {currentStep === 'shipping' && 'Shipping Information'}
            {currentStep === 'shipping-method' && 'Shipping Method'}
            {currentStep === 'payment' && 'Payment'}
            {currentStep === 'review' && 'Order Review'}
          </Text>
          <TopMainMenu />
        </View>

        {/* Enhanced Step Indicator */}
        <View style={styles.stepIndicatorContainer}>
          <TouchableOpacity
            style={[styles.stepItem, currentStep === 'billing' && styles.stepItemActive]}
            onPress={() => {
              handleQuickNav('billing');
            }}
            disabled={false}
          >
            <View
              style={[
                styles.stepIconCircle,
                currentStep === 'billing' && styles.stepIconCircleActive,
                isStepCompleted('billing') && styles.stepIconCircleCompleted,
              ]}
            >
              {isStepCompleted('billing') ? (
                <Check size={16} color={ShopColors.cardBackground} />
              ) : (
                <Text
                  style={[styles.stepNumber, currentStep === 'billing' && styles.stepNumberActive]}
                >
                  1
                </Text>
              )}
            </View>
            <View style={styles.stepTextContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  currentStep === 'billing' && styles.stepTitleActive,
                  isStepCompleted('billing') && styles.stepTitleCompleted,
                ]}
              >
                Billing
              </Text>
              <Text
                style={[
                  styles.stepSubtitle,
                  currentStep === 'billing' && styles.stepSubtitleActive,
                ]}
              >
                Address
              </Text>
            </View>
          </TouchableOpacity>

          {/* Connector Line */}
          <View
            style={[
              styles.stepConnector,
              isStepCompleted('billing') && styles.stepConnectorCompleted,
            ]}
          />

          {/* Step 2: Shipping Address */}
          <TouchableOpacity
            style={[styles.stepItem, currentStep === 'shipping' && styles.stepItemActive]}
            onPress={() => {
              if (isStepCompleted('billing')) {
                handleQuickNav('shipping');
              }
            }}
            disabled={!isStepCompleted('billing')}
          >
            <View
              style={[
                styles.stepIconCircle,
                currentStep === 'shipping' && styles.stepIconCircleActive,
                isStepCompleted('shipping') && styles.stepIconCircleCompleted,
              ]}
            >
              {isStepCompleted('shipping') ? (
                <Check size={16} color={ShopColors.cardBackground} />
              ) : (
                <Text
                  style={[styles.stepNumber, currentStep === 'shipping' && styles.stepNumberActive]}
                >
                  2
                </Text>
              )}
            </View>
            <View style={styles.stepTextContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  currentStep === 'shipping' && styles.stepTitleActive,
                  isStepCompleted('shipping') && styles.stepTitleCompleted,
                ]}
              >
                Shipping
              </Text>
              <Text
                style={[
                  styles.stepSubtitle,
                  currentStep === 'shipping' && styles.stepSubtitleActive,
                ]}
              >
                Address
              </Text>
            </View>
          </TouchableOpacity>

          {/* Connector Line */}
          <View
            style={[
              styles.stepConnector,
              isStepCompleted('shipping') && styles.stepConnectorCompleted,
            ]}
          />

          {/* Step 3: Shipping Method */}
          <TouchableOpacity
            style={[styles.stepItem, currentStep === 'shipping-method' && styles.stepItemActive]}
            onPress={() => {
              if (isStepCompleted('shipping')) {
                handleQuickNav('shipping-method');
              }
            }}
            disabled={!isStepCompleted('shipping')}
          >
            <View
              style={[
                styles.stepIconCircle,
                currentStep === 'shipping-method' && styles.stepIconCircleActive,
                isStepCompleted('shipping-method') && styles.stepIconCircleCompleted,
              ]}
            >
              {isStepCompleted('shipping-method') ? (
                <Check size={16} color={ShopColors.cardBackground} />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep === 'shipping-method' && styles.stepNumberActive,
                  ]}
                >
                  3
                </Text>
              )}
            </View>
            <View style={styles.stepTextContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  currentStep === 'shipping-method' && styles.stepTitleActive,
                  isStepCompleted('shipping-method') && styles.stepTitleCompleted,
                ]}
              >
                Shipping
              </Text>
              <Text
                style={[
                  styles.stepSubtitle,
                  currentStep === 'shipping-method' && styles.stepSubtitleActive,
                ]}
              >
                Method
              </Text>
            </View>
          </TouchableOpacity>

          {/* Connector Line */}
          <View
            style={[
              styles.stepConnector,
              isStepCompleted('shipping-method') && styles.stepConnectorCompleted,
            ]}
          />

          {/* Step 4: Payment Method */}
          <TouchableOpacity
            style={[styles.stepItem, currentStep === 'payment' && styles.stepItemActive]}
            onPress={() => {
              if (isStepCompleted('shipping-method')) {
                handleQuickNav('payment');
              }
            }}
            disabled={!isStepCompleted('shipping-method')}
          >
            <View
              style={[
                styles.stepIconCircle,
                currentStep === 'payment' && styles.stepIconCircleActive,
                isStepCompleted('payment') && styles.stepIconCircleCompleted,
              ]}
            >
              {isStepCompleted('payment') ? (
                <Check size={16} color={ShopColors.cardBackground} />
              ) : (
                <Text
                  style={[styles.stepNumber, currentStep === 'payment' && styles.stepNumberActive]}
                >
                  4
                </Text>
              )}
            </View>
            <View style={styles.stepTextContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  currentStep === 'payment' && styles.stepTitleActive,
                  isStepCompleted('payment') && styles.stepTitleCompleted,
                ]}
              >
                Payment
              </Text>
              <Text
                style={[
                  styles.stepSubtitle,
                  currentStep === 'payment' && styles.stepSubtitleActive,
                ]}
              >
                Method
              </Text>
            </View>
          </TouchableOpacity>

          {/* Connector Line */}
          <View
            style={[
              styles.stepConnector,
              isStepCompleted('payment') && styles.stepConnectorCompleted,
            ]}
          />

          {/* Step 5: Review & Place Order */}
          <TouchableOpacity
            style={[styles.stepItem, currentStep === 'review' && styles.stepItemActive]}
            onPress={() => {
              if (isStepCompleted('payment')) {
                handleQuickNav('review');
              }
            }}
            disabled={!isStepCompleted('payment')}
          >
            <View
              style={[
                styles.stepIconCircle,
                currentStep === 'review' && styles.stepIconCircleActive,
                isStepCompleted('review') && styles.stepIconCircleCompleted,
              ]}
            >
              {isStepCompleted('review') ? (
                <Check size={16} color={ShopColors.cardBackground} />
              ) : (
                <Text
                  style={[styles.stepNumber, currentStep === 'review' && styles.stepNumberActive]}
                >
                  5
                </Text>
              )}
            </View>
            <View style={styles.stepTextContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  currentStep === 'review' && styles.stepTitleActive,
                  isStepCompleted('review') && styles.stepTitleCompleted,
                ]}
              >
                Review
              </Text>
              <Text
                style={[styles.stepSubtitle, currentStep === 'review' && styles.stepSubtitleActive]}
              >
                Order
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Billing Address Step */}
          {currentStep === 'billing' && (
            <View style={styles.section}>
              {/* Existing Addresses */}
              {addresses.length > 0 && !showNewAddressForm && (
                <View style={styles.addressList}>
                  {addresses.map(address => (
                    <TouchableOpacity
                      key={address.id}
                      style={[
                        styles.addressCard,
                        selectedAddressId === address.id && styles.addressCardSelected,
                      ]}
                      onPress={() => setSelectedAddressId(address.id)}
                    >
                      <View style={styles.addressHeader}>
                        <View
                          style={[
                            styles.radioButton,
                            selectedAddressId === address.id && styles.radioButtonSelected,
                          ]}
                        >
                          {selectedAddressId === address.id && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                        <View style={styles.addressInfo}>
                          {address.attributes.label && (
                            <Text style={styles.addressLabel}>{address.attributes.label}</Text>
                          )}
                          <Text style={styles.addressName}>
                            {address.attributes.firstName} {address.attributes.lastName}
                          </Text>
                          <Text style={styles.addressText}>{address.attributes.street}</Text>
                          {address.attributes.street2 && (
                            <Text style={styles.addressText}>{address.attributes.street2}</Text>
                          )}
                          <Text style={styles.addressText}>
                            {address.attributes.city}, {address.attributes.postalCode}
                          </Text>
                          {address.attributes.phone && (
                            <Text style={styles.addressText}>
                              Phone: {address.attributes.phone}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={styles.addAddressButton}
                    onPress={() => setShowNewAddressForm(true)}
                  >
                    <Plus size={20} color={ShopColors.primary} />
                    <Text style={styles.addAddressButtonText}>Add New Address</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* New Address Form */}
              {(showNewAddressForm || addresses.length === 0) && (
                <View style={styles.addressForm}>
                  <Text style={styles.formTitle}>
                    {addresses.length === 0 ? 'Add Billing Address' : 'New Address'}
                  </Text>

                  <View style={styles.formRow}>
                    <View style={styles.formFieldHalf}>
                      <Text style={styles.formLabel}>First Name *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={newAddress.firstName}
                        onChangeText={text => setNewAddress({ ...newAddress, firstName: text })}
                        placeholder="First Name"
                        placeholderTextColor={ShopColors.textSecondary}
                      />
                    </View>
                    <View style={styles.formFieldHalf}>
                      <Text style={styles.formLabel}>Last Name *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={newAddress.lastName}
                        onChangeText={text => setNewAddress({ ...newAddress, lastName: text })}
                        placeholder="Last Name"
                        placeholderTextColor={ShopColors.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Street Address *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={newAddress.street}
                      onChangeText={text => setNewAddress({ ...newAddress, street: text })}
                      placeholder="Street Address"
                      placeholderTextColor={ShopColors.textSecondary}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Apartment, Suite, etc.</Text>
                    <TextInput
                      style={styles.formInput}
                      value={newAddress.street2}
                      onChangeText={text => setNewAddress({ ...newAddress, street2: text })}
                      placeholder="Apartment, Suite, etc."
                      placeholderTextColor={ShopColors.textSecondary}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formFieldHalf}>
                      <Text style={styles.formLabel}>City *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={newAddress.city}
                        onChangeText={text => setNewAddress({ ...newAddress, city: text })}
                        placeholder="City"
                        placeholderTextColor={ShopColors.textSecondary}
                      />
                    </View>
                    <View style={styles.formFieldHalf}>
                      <Text style={styles.formLabel}>Postal Code *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={newAddress.postalCode}
                        onChangeText={text => setNewAddress({ ...newAddress, postalCode: text })}
                        placeholder="Postal Code"
                        placeholderTextColor={ShopColors.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formFieldHalf}>
                      <Text style={styles.formLabel}>Country *</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={newAddress.country}
                          onValueChange={value =>
                            setNewAddress({ ...newAddress, country: value as string })
                          }
                          style={styles.picker}
                        >
                          <Picker.Item label="Select a country" value="" />
                          {countries.map(country => (
                            <Picker.Item key={country.id} label={country.name} value={country.id} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                    <View style={styles.formFieldHalf}>
                      <Text style={styles.formLabel}>
                        State/Region{regions.length > 0 ? ' *' : ''}
                      </Text>
                      {loadingRegions ? (
                        <View style={styles.formInput}>
                          <ActivityIndicator size="small" color={ShopColors.primary} />
                        </View>
                      ) : regions.length > 0 ? (
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={newAddress.region}
                            onValueChange={value =>
                              setNewAddress({ ...newAddress, region: value as string })
                            }
                            style={styles.picker}
                          >
                            <Picker.Item label="Select a state/region" value="" />
                            {regions.map(region => (
                              <Picker.Item key={region.id} label={region.name} value={region.id} />
                            ))}
                          </Picker>
                        </View>
                      ) : (
                        <TextInput
                          style={styles.formInput}
                          value={newAddress.region}
                          onChangeText={text => setNewAddress({ ...newAddress, region: text })}
                          placeholder="State/Region (optional)"
                          placeholderTextColor={ShopColors.textSecondary}
                          editable={!!newAddress.country}
                        />
                      )}
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Phone</Text>
                    <TextInput
                      style={styles.formInput}
                      value={newAddress.phone}
                      onChangeText={text => setNewAddress({ ...newAddress, phone: text })}
                      placeholder="Phone"
                      placeholderTextColor={ShopColors.textSecondary}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Address Label (e.g., Home, Office)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={newAddress.label}
                      onChangeText={text => setNewAddress({ ...newAddress, label: text })}
                      placeholder="Address Label"
                      placeholderTextColor={ShopColors.textSecondary}
                    />
                  </View>

                  <View style={styles.formButtons}>
                    {addresses.length > 0 && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowNewAddressForm(false);
                          setNewAddress({
                            firstName: '',
                            lastName: '',
                            street: '',
                            street2: '',
                            city: '',
                            postalCode: '',
                            region: '',
                            country: '',
                            phone: '',
                            label: '',
                          });
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.saveAddressButton,
                        isSubmitting && styles.saveAddressButtonDisabled,
                      ]}
                      onPress={handleCreateNewAddress}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color={ShopColors.cardBackground} />
                      ) : (
                        <Text style={styles.saveAddressButtonText}>Save Address</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Shipping Address Step */}
          {currentStep === 'shipping' && (
            <View style={[styles.section, isSubmitting && styles.sectionLoading]}>
              {/* Loading overlay when fetching shipping methods */}
              {isSubmitting && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingOverlayContent}>
                    <ActivityIndicator size="large" color={ShopColors.primary} />
                    {loadingShippingMethods && (
                      <Text style={styles.loadingOverlaySubtext}>Loading shipping methods...</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Same as Billing Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setSameAsBilling(!sameAsBilling)}
                disabled={isSubmitting}
              >
                <View style={[styles.checkbox, sameAsBilling && styles.checkboxChecked]}>
                  {sameAsBilling && <Check size={16} color={ShopColors.cardBackground} />}
                </View>
                <Text style={styles.checkboxLabel}>Same as billing address</Text>
              </TouchableOpacity>

              {/* Show shipping address selector if not same as billing */}
              {!sameAsBilling && (
                <>
                  {addresses.length > 0 && !showNewShippingAddressForm && (
                    <View style={styles.addressList}>
                      {addresses.map(address => (
                        <TouchableOpacity
                          key={address.id}
                          style={[
                            styles.addressCard,
                            shippingAddressId === address.id && styles.addressCardSelected,
                          ]}
                          onPress={() => setShippingAddressId(address.id)}
                        >
                          <View style={styles.addressHeader}>
                            <View
                              style={[
                                styles.radioButton,
                                shippingAddressId === address.id && styles.radioButtonSelected,
                              ]}
                            >
                              {shippingAddressId === address.id && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                            <View style={styles.addressInfo}>
                              {address.attributes.label && (
                                <Text style={styles.addressLabel}>{address.attributes.label}</Text>
                              )}
                              <Text style={styles.addressName}>
                                {address.attributes.firstName} {address.attributes.lastName}
                              </Text>
                              <Text style={styles.addressText}>{address.attributes.street}</Text>
                              {address.attributes.street2 && (
                                <Text style={styles.addressText}>{address.attributes.street2}</Text>
                              )}
                              <Text style={styles.addressText}>
                                {address.attributes.city}, {address.attributes.postalCode}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}

                      <TouchableOpacity
                        style={styles.addAddressButton}
                        onPress={() => setShowNewShippingAddressForm(true)}
                      >
                        <Plus size={20} color={ShopColors.primary} />
                        <Text style={styles.addAddressButtonText}>Add New Shipping Address</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {showNewShippingAddressForm && (
                    <View style={styles.addressForm}>
                      <Text style={styles.formTitle}>New Shipping Address</Text>
                      {/* Form fields similar to billing - reusing same structure */}
                      <View style={styles.formRow}>
                        <View style={styles.formFieldHalf}>
                          <Text style={styles.formLabel}>First Name *</Text>
                          <TextInput
                            style={styles.formInput}
                            value={newShippingAddress.firstName}
                            onChangeText={text =>
                              setNewShippingAddress({ ...newShippingAddress, firstName: text })
                            }
                            placeholder="First Name"
                            placeholderTextColor={ShopColors.textSecondary}
                          />
                        </View>
                        <View style={styles.formFieldHalf}>
                          <Text style={styles.formLabel}>Last Name *</Text>
                          <TextInput
                            style={styles.formInput}
                            value={newShippingAddress.lastName}
                            onChangeText={text =>
                              setNewShippingAddress({ ...newShippingAddress, lastName: text })
                            }
                            placeholder="Last Name"
                            placeholderTextColor={ShopColors.textSecondary}
                          />
                        </View>
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Street Address *</Text>
                        <TextInput
                          style={styles.formInput}
                          value={newShippingAddress.street}
                          onChangeText={text =>
                            setNewShippingAddress({ ...newShippingAddress, street: text })
                          }
                          placeholder="Street Address"
                          placeholderTextColor={ShopColors.textSecondary}
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Apartment, Suite, etc.</Text>
                        <TextInput
                          style={styles.formInput}
                          value={newShippingAddress.street2}
                          onChangeText={text =>
                            setNewShippingAddress({ ...newShippingAddress, street2: text })
                          }
                          placeholder="Apartment, Suite, etc."
                          placeholderTextColor={ShopColors.textSecondary}
                        />
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.formFieldHalf}>
                          <Text style={styles.formLabel}>City *</Text>
                          <TextInput
                            style={styles.formInput}
                            value={newShippingAddress.city}
                            onChangeText={text =>
                              setNewShippingAddress({ ...newShippingAddress, city: text })
                            }
                            placeholder="City"
                            placeholderTextColor={ShopColors.textSecondary}
                          />
                        </View>
                        <View style={styles.formFieldHalf}>
                          <Text style={styles.formLabel}>Postal Code *</Text>
                          <TextInput
                            style={styles.formInput}
                            value={newShippingAddress.postalCode}
                            onChangeText={text =>
                              setNewShippingAddress({ ...newShippingAddress, postalCode: text })
                            }
                            placeholder="Postal Code"
                            placeholderTextColor={ShopColors.textSecondary}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.formFieldHalf}>
                          <Text style={styles.formLabel}>Country *</Text>
                          <View style={styles.pickerContainer}>
                            <Picker
                              selectedValue={newShippingAddress.country}
                              onValueChange={value =>
                                setNewShippingAddress({
                                  ...newShippingAddress,
                                  country: value as string,
                                })
                              }
                              style={styles.picker}
                            >
                              <Picker.Item label="Select a country" value="" />
                              {countries.map(country => (
                                <Picker.Item
                                  key={country.id}
                                  label={country.name}
                                  value={country.id}
                                />
                              ))}
                            </Picker>
                          </View>
                        </View>
                        <View style={styles.formFieldHalf}>
                          <Text style={styles.formLabel}>
                            State/Region{regions.length > 0 ? ' *' : ''}
                          </Text>
                          {loadingRegions ? (
                            <View style={styles.formInput}>
                              <ActivityIndicator size="small" color={ShopColors.primary} />
                            </View>
                          ) : regions.length > 0 ? (
                            <View style={styles.pickerContainer}>
                              <Picker
                                selectedValue={newShippingAddress.region}
                                onValueChange={value =>
                                  setNewShippingAddress({
                                    ...newShippingAddress,
                                    region: value as string,
                                  })
                                }
                                style={styles.picker}
                              >
                                <Picker.Item label="Select a state/region" value="" />
                                {regions.map(region => (
                                  <Picker.Item
                                    key={region.id}
                                    label={region.name}
                                    value={region.id}
                                  />
                                ))}
                              </Picker>
                            </View>
                          ) : (
                            <TextInput
                              style={styles.formInput}
                              value={newShippingAddress.region}
                              onChangeText={text =>
                                setNewShippingAddress({ ...newShippingAddress, region: text })
                              }
                              placeholder="State/Region (optional)"
                              placeholderTextColor={ShopColors.textSecondary}
                              editable={!!newShippingAddress.country}
                            />
                          )}
                        </View>
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Phone</Text>
                        <TextInput
                          style={styles.formInput}
                          value={newShippingAddress.phone}
                          onChangeText={text =>
                            setNewShippingAddress({ ...newShippingAddress, phone: text })
                          }
                          placeholder="Phone"
                          placeholderTextColor={ShopColors.textSecondary}
                          keyboardType="phone-pad"
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Address Label (e.g., Home, Office)</Text>
                        <TextInput
                          style={styles.formInput}
                          value={newShippingAddress.label}
                          onChangeText={text =>
                            setNewShippingAddress({ ...newShippingAddress, label: text })
                          }
                          placeholder="Address Label"
                          placeholderTextColor={ShopColors.textSecondary}
                        />
                      </View>

                      <View style={styles.formButtons}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => {
                            setShowNewShippingAddressForm(false);
                            setNewShippingAddress({
                              firstName: '',
                              lastName: '',
                              street: '',
                              street2: '',
                              city: '',
                              postalCode: '',
                              region: '',
                              country: '',
                              phone: '',
                              label: '',
                            });
                          }}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.saveAddressButton,
                            isSubmitting && styles.saveAddressButtonDisabled,
                          ]}
                          onPress={handleCreateNewAddress}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <ActivityIndicator size="small" color={ShopColors.cardBackground} />
                          ) : (
                            <Text style={styles.saveAddressButtonText}>Save Address</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Shipping Method Step */}
          {currentStep === 'shipping-method' && (
            <View style={styles.section}>
              {loadingShippingMethods ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={ShopColors.primary} />
                  <Text style={styles.loadingText}>Loading shipping methods...</Text>
                </View>
              ) : shippingMethods.length > 0 ? (
                <View style={styles.methodsList}>
                  {shippingMethods.map(method => {
                    const shippingCost = method.attributes?.types?.[0]?.shippingCost;

                    return (
                      <TouchableOpacity
                        key={method.id}
                        style={[
                          styles.methodCard,
                          selectedShippingMethod === method.id && styles.methodCardSelected,
                        ]}
                        onPress={() => setSelectedShippingMethod(method.id)}
                      >
                        <View style={styles.methodHeader}>
                          <View
                            style={[
                              styles.radioButton,
                              selectedShippingMethod === method.id && styles.radioButtonSelected,
                            ]}
                          >
                            {selectedShippingMethod === method.id && (
                              <View style={styles.radioButtonInner} />
                            )}
                          </View>
                          <View style={styles.methodInfo}>
                            <Text style={styles.methodName}>
                              {method.attributes?.label || method.id}
                            </Text>
                            {shippingCost && (
                              <Text style={styles.methodPrice}>${formatPrice(shippingCost)}</Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noMethodsContainer}>
                  <Text style={styles.noMethodsText}>No shipping methods available</Text>
                  <Text style={styles.noMethodsSubtext}>
                    Please try refreshing to load available shipping options.
                  </Text>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRetryShippingMethods}
                    disabled={loadingShippingMethods}
                  >
                    <Text style={styles.refreshButtonText}>Refresh Shipping Methods</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Payment Method Step */}
          {currentStep === 'payment' && (
            <View style={styles.section}>
              {loadingPaymentMethods ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={ShopColors.primary} />
                  <Text style={styles.loadingText}>Loading payment methods...</Text>
                </View>
              ) : paymentMethods.length > 0 ? (
                <View style={styles.methodsList}>
                  {paymentMethods.map(method => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.methodCard,
                        selectedPaymentMethod === method.id && styles.methodCardSelected,
                      ]}
                      onPress={() => setSelectedPaymentMethod(method.id)}
                    >
                      <View style={styles.methodHeader}>
                        <View
                          style={[
                            styles.radioButton,
                            selectedPaymentMethod === method.id && styles.radioButtonSelected,
                          ]}
                        >
                          {selectedPaymentMethod === method.id && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                        <View style={styles.methodInfo}>
                          <Text style={styles.methodName}>
                            {method.attributes?.label || method.id}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noMethodsText}>No payment methods available</Text>
              )}
            </View>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <View style={styles.section}>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Billing Address</Text>
                {selectedAddressId && addresses.find(a => a.id === selectedAddressId) && (
                  <View style={styles.reviewAddressCard}>
                    {(() => {
                      const addr = addresses.find(a => a.id === selectedAddressId)!;
                      return (
                        <>
                          <Text style={styles.reviewAddressText}>
                            {addr.attributes.firstName} {addr.attributes.lastName}
                          </Text>
                          <Text style={styles.reviewAddressText}>{addr.attributes.street}</Text>
                          <Text style={styles.reviewAddressText}>
                            {addr.attributes.city}, {addr.attributes.postalCode}
                          </Text>
                        </>
                      );
                    })()}
                  </View>
                )}
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Shipping Address</Text>
                {(sameAsBilling ? selectedAddressId : shippingAddressId) && (
                  <View style={styles.reviewAddressCard}>
                    {(() => {
                      const addrId = sameAsBilling ? selectedAddressId : shippingAddressId;
                      const addr = addresses.find(a => a.id === addrId);
                      if (!addr) return <Text>-</Text>;
                      return (
                        <>
                          <Text style={styles.reviewAddressText}>
                            {addr.attributes.firstName} {addr.attributes.lastName}
                          </Text>
                          <Text style={styles.reviewAddressText}>{addr.attributes.street}</Text>
                          <Text style={styles.reviewAddressText}>
                            {addr.attributes.city}, {addr.attributes.postalCode}
                          </Text>
                        </>
                      );
                    })()}
                  </View>
                )}
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Shipping Method</Text>
                {selectedShippingMethod &&
                  shippingMethods.find(m => m.id === selectedShippingMethod) && (
                    <Text style={styles.reviewMethodText}>
                      {shippingMethods.find(m => m.id === selectedShippingMethod)?.attributes
                        ?.label || 'Selected'}
                    </Text>
                  )}
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Payment Method</Text>
                {selectedPaymentMethod &&
                  paymentMethods.find(m => m.id === selectedPaymentMethod) && (
                    <Text style={styles.reviewMethodText}>
                      {paymentMethods.find(m => m.id === selectedPaymentMethod)?.attributes
                        ?.label || 'Selected'}
                    </Text>
                  )}
              </View>
            </View>
          )}

          {/* Collapsible Order Items Section - Shown on all steps */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setLineItemsExpanded(!lineItemsExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View>
                  <Text style={styles.sectionTitle}>Order Items ({totals.itemCount})</Text>
                  <Text style={styles.sectionSubtitle}>
                    {lineItemsExpanded ? 'Tap to collapse' : 'Tap to expand'}
                  </Text>
                </View>
              </View>
              <View style={styles.sectionHeaderRight}>
                {lineItemsExpanded && (
                  <TouchableOpacity
                    style={styles.editItemsButton}
                    onPress={e => {
                      e.stopPropagation();
                      router.push(`/shopping-list/${sourceId || id}`);
                    }}
                  >
                    <Text style={styles.editItemsButtonText}>Edit Items</Text>
                  </TouchableOpacity>
                )}
                {lineItemsExpanded ? (
                  <ChevronUp size={24} color={ShopColors.text} />
                ) : (
                  <ChevronDown size={24} color={ShopColors.text} />
                )}
              </View>
            </TouchableOpacity>

            {lineItemsExpanded && (
              <View style={styles.lineItemsList}>
                {lineItems.map((item, index) => {
                  const product = getProductForLineItem(item);
                  const imageUrl = product ? getProductImage(product) : null;

                  // Get inventory status from enriched line item attributes first, then from product
                  const inventoryStatus =
                    item.attributes.inventoryStatus || product?.attributes?.inventory_status;

                  const productName =
                    item.attributes.productName || product?.attributes?.name || 'Unknown Product';
                  const productSku = item.attributes.productSku || product?.attributes?.sku;
                  const unitCode = item.attributes.productUnitCode;
                  const unitName = getUnitName(item);
                  const price = item.attributes.price || item.attributes.value || '0';
                  const lineTotal =
                    item.attributes.totalValue ||
                    item.attributes.subTotal ||
                    (parseFloat(price) * item.attributes.quantity).toFixed(2);

                  return (
                    <View key={item.id} style={styles.lineItemCard}>
                      <View style={styles.lineItemMainContent}>
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

                        {/* Product Details */}
                        <View style={styles.lineItemDetails}>
                          <TouchableOpacity
                            onPress={() => {
                              const productId = item.relationships?.product?.data?.id;
                              if (productId) {
                                router.push(`/product/${productId}?redirect=/checkout/${id}`);
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.lineItemName} numberOfLines={2}>
                              {productName}
                            </Text>
                          </TouchableOpacity>

                          <View style={styles.lineItemSkuRow}>
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
                            {productSku && (
                              <Text style={styles.lineItemSku}>SKU: {productSku}</Text>
                            )}
                          </View>

                          <View style={styles.lineItemQuantityRow}>
                            <View style={styles.lineItemQuantityBadge}>
                              <Text style={styles.lineItemQuantityText}>
                                Qty: {item.attributes.quantity}
                              </Text>
                            </View>
                            {unitCode && (
                              <View style={styles.lineItemUnitBadge}>
                                <Text style={styles.lineItemUnitText}>{unitCode}</Text>
                              </View>
                            )}
                          </View>

                          {price !== '0' && (
                            <View style={styles.lineItemPricing}>
                              <Text style={styles.lineItemUnitPrice}>
                                ${formatPrice(price)} / {unitName}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Price */}
                        <View style={styles.lineItemPriceContainer}>
                          <Text style={styles.lineItemPrice}>${formatPrice(lineTotal)}</Text>
                        </View>
                      </View>

                      {/* Divider between items (except last) */}
                      {index < lineItems.length - 1 && <View style={styles.lineItemDivider} />}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Order Summary */}
            <View style={styles.orderSummaryCard}>
              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryLabel}>Subtotal ({totals.itemCount} items):</Text>
                <Text style={styles.orderSummaryValue}>${totals.subtotal}</Text>
              </View>

              {/* Show discount if applicable */}
              {totals.hasDiscount && (
                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryDiscountLabel}>Discount:</Text>
                  <Text style={styles.orderSummaryDiscountValue}>-${totals.discount}</Text>
                </View>
              )}

              {/* Show shipping cost if applicable */}
              {totals.hasShipping && (
                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryLabel}>Shipping:</Text>
                  <Text style={styles.orderSummaryValue}>${totals.shipping}</Text>
                </View>
              )}

              <View style={styles.orderSummaryDivider} />
              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryTotalLabel}>Total:</Text>
                <Text style={styles.orderSummaryTotalValue}>${totals.total}</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Footer with Order Summary and Continue Button */}
        {!showNewAddressForm && !showNewShippingAddressForm && (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.contentWrapper}>
              <View style={styles.footerContent}>
                {/* Order Summary (Left Side) */}
                <View style={styles.orderSummaryLeft}>
                  <View style={styles.orderTotalRow}>
                    <Text style={styles.orderTotalLabel}>Order Total</Text>
                    <TouchableOpacity
                      onPress={() => setShowOrderSummaryModal(true)}
                      style={styles.infoIconButton}
                    >
                      <Info size={16} color={ShopColors.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.orderTotalValue}>${totals.total}</Text>
                </View>

                {/* Continue Button (Right Side) */}
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    ((currentStep === 'billing' && !selectedAddressId) ||
                      (currentStep === 'shipping' && !sameAsBilling && !shippingAddressId) ||
                      (currentStep === 'shipping-method' && !selectedShippingMethod) ||
                      (currentStep === 'payment' && !selectedPaymentMethod) ||
                      isSubmitting) &&
                      styles.continueButtonDisabled,
                  ]}
                  onPress={handleContinue}
                  disabled={
                    (currentStep === 'billing' && !selectedAddressId) ||
                    (currentStep === 'shipping' && !sameAsBilling && !shippingAddressId) ||
                    (currentStep === 'shipping-method' && !selectedShippingMethod) ||
                    (currentStep === 'payment' && !selectedPaymentMethod) ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={ShopColors.cardBackground} />
                  ) : (
                    <Text style={styles.continueButtonText}>
                      {currentStep === 'review' ? 'Place Order' : 'Continue'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Order Summary Modal */}
        <Modal
          visible={showOrderSummaryModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOrderSummaryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Summary</Text>
                <TouchableOpacity
                  onPress={() => setShowOrderSummaryModal(false)}
                  style={styles.modalCloseButton}
                >
                  <X size={24} color={ShopColors.text} />
                </TouchableOpacity>
              </View>

              {/* Order Summary Details */}
              <View style={styles.modalBody}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal ({totals.itemCount} items):</Text>
                  <Text style={styles.summaryValue}>${totals.subtotal}</Text>
                </View>

                {totals.hasDiscount && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryDiscountLabel}>Discount:</Text>
                    <Text style={styles.summaryDiscountValue}>-${totals.discount}</Text>
                  </View>
                )}

                {totals.hasShipping && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping:</Text>
                    <Text style={styles.summaryValue}>${totals.shipping}</Text>
                  </View>
                )}

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryTotalLabel}>Total:</Text>
                  <Text style={styles.summaryTotalValue}>${totals.total}</Text>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowOrderSummaryModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
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
  section: {
    marginBottom: 20,
  },
  sectionLoading: {
    minHeight: 300,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: ShopColors.textSecondary,
    marginTop: 2,
  },
  editItemsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ShopColors.primary,
    backgroundColor: ShopColors.background,
  },
  editItemsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  // Line Items
  lineItemsList: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.border,
    overflow: 'hidden',
  },
  lineItemCard: {
    backgroundColor: ShopColors.cardBackground,
  },
  lineItemMainContent: {
    flexDirection: 'row',
    padding: 12,
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
  lineItemImageText: {
    fontSize: 24,
    fontWeight: '700',
    color: ShopColors.primary,
  },
  lineItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  lineItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  lineItemSkuRow: {
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
  lineItemSku: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  lineItemQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  lineItemQuantityBadge: {
    backgroundColor: ShopColors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lineItemQuantityText: {
    fontSize: 13,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  lineItemUnitBadge: {
    backgroundColor: ShopColors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  lineItemUnitText: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.text,
  },
  lineItemPricing: {
    marginTop: 2,
  },
  lineItemUnitPrice: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  lineItemPriceContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  lineItemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  lineItemDivider: {
    height: 1,
    backgroundColor: ShopColors.border,
    marginLeft: 104, // Align with content after image
  },
  // Order Summary
  orderSummaryCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: ShopColors.primary,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  orderSummaryLabel: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    fontWeight: '500',
  },
  orderSummaryValue: {
    fontSize: 15,
    color: ShopColors.text,
    fontWeight: '600',
  },
  orderSummaryDiscountLabel: {
    fontSize: 14,
    color: ShopColors.success,
    fontWeight: '500',
  },
  orderSummaryDiscountValue: {
    fontSize: 15,
    color: ShopColors.success,
    fontWeight: '600',
  },
  orderSummaryDivider: {
    height: 1,
    backgroundColor: ShopColors.border,
    marginVertical: 8,
  },
  orderSummaryTotalLabel: {
    fontSize: 18,
    color: ShopColors.text,
    fontWeight: '700',
  },
  orderSummaryTotalValue: {
    fontSize: 22,
    color: ShopColors.primary,
    fontWeight: '700',
  },
  // Addresses
  addressList: {
    gap: 12,
  },
  addressCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: ShopColors.border,
  },
  addressCardSelected: {
    borderColor: ShopColors.primary,
    backgroundColor: ShopColors.primary + '10',
  },
  addressHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioButtonSelected: {
    borderColor: ShopColors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ShopColors.primary,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ShopColors.primary,
    marginBottom: 4,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    lineHeight: 20,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: ShopColors.primary,
    backgroundColor: ShopColors.background,
    gap: 8,
  },
  addAddressButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.primary,
  },
  // Address Form
  addressForm: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formFieldHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: ShopColors.text,
    backgroundColor: ShopColors.background,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    backgroundColor: ShopColors.background,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
  },
  picker: {
    height: Platform.OS === 'ios' ? 48 : 50,
    width: '100%',
    color: ShopColors.text,
    backgroundColor: ShopColors.background,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.text,
  },
  saveAddressButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: ShopColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAddressButtonDisabled: {
    opacity: 0.6,
  },
  saveAddressButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: ShopColors.cardBackground,
  },
  bottomSpacing: {
    height: 80,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: ShopColors.cardBackground,
    borderTopWidth: 2,
    borderTopColor: ShopColors.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderSummaryLeft: {
    maxWidth: 200,
    flex: 1,
    marginRight: 8,
  },
  orderTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  orderTotalLabel: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    fontWeight: '500',
  },
  infoIconButton: {
    padding: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTotalValue: {
    fontSize: 18,
    color: ShopColors.text,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: ShopColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 120,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 16,
    fontWeight: '700',
  },
  // Enhanced Step Indicator
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: ShopColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
    paddingHorizontal: 8,
    paddingVertical: 16,
    gap: 4,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    opacity: 0.5,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ShopColors.background,
    borderWidth: 2,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepIconCircleActive: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
    shadowColor: ShopColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepIconCircleCompleted: {
    backgroundColor: ShopColors.success,
    borderColor: ShopColors.success,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.textSecondary,
  },
  stepNumberActive: {
    color: ShopColors.cardBackground,
  },
  stepTextContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    textAlign: 'center',
  },
  stepTitleActive: {
    color: ShopColors.primary,
    fontWeight: '700',
  },
  stepTitleCompleted: {
    color: ShopColors.success,
    fontWeight: '700',
  },
  stepSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  stepSubtitleActive: {
    color: ShopColors.primary,
  },
  stepConnector: {
    height: 2,
    backgroundColor: ShopColors.border,
    alignSelf: 'center',
    flex: 0.5,
    marginHorizontal: -4,
  },
  stepConnectorCompleted: {
    backgroundColor: ShopColors.success,
  },
  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.text,
  },
  // Method Cards
  methodsList: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: ShopColors.border,
  },
  methodCardSelected: {
    borderColor: ShopColors.primary,
    backgroundColor: ShopColors.primary + '10',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 4,
  },
  methodPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: ShopColors.primary,
  },
  noMethodsText: {
    fontSize: 15,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    padding: 24,
  },
  noMethodsContainer: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  noMethodsSubtext: {
    fontSize: 13,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: ShopColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 15,
    fontWeight: '600',
  },
  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingOverlayContent: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    textAlign: 'center',
  },
  loadingOverlaySubtext: {
    marginTop: 8,
    fontSize: 13,
    color: ShopColors.textSecondary,
    textAlign: 'center',
  },
  // Review Sections
  reviewSection: {
    marginBottom: 20,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 12,
  },
  reviewAddressCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  reviewAddressText: {
    fontSize: 14,
    color: ShopColors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  reviewMethodText: {
    fontSize: 14,
    color: ShopColors.text,
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  // Modal Styles
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
    maxWidth: 400,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
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
    fontSize: 16,
    color: ShopColors.text,
    fontWeight: '600',
  },
  summaryDiscountLabel: {
    fontSize: 15,
    color: ShopColors.success,
    fontWeight: '500',
  },
  summaryDiscountValue: {
    fontSize: 16,
    color: ShopColors.success,
    fontWeight: '600',
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
  modalButton: {
    backgroundColor: ShopColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 16,
    fontWeight: '700',
  },
});
