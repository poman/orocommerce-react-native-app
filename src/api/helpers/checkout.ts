import api from '../api';
import {
  CHECKOUTS_ENDPOINT,
  CUSTOMER_ADDRESSES_ENDPOINT,
  COUNTRIES_ENDPOINT,
  REGIONS_ENDPOINT,
} from '../endpoints';
import { IJsonApiResponse, IJsonApiListResponse } from '../types';
import { Platform } from 'react-native';

export interface ICheckoutLineItemAttributes {
  quantity: number;
  productSku?: string;
  productName?: string;
  productUnitCode?: string;
  productUnitLabel?: string;
  inventoryStatus?: string;
  freeFormProduct?: string | null;
  comment?: string | null;
  priceFixed?: boolean;
  shippingMethod?: string | null;
  shippingMethodType?: string | null;
  shippingEstimateAmount?: string | null;
  checksum?: string;
  price?: string;
  currency?: string;
  subTotal?: string;
  totalValue?: string;
  discount?: string;
  value?: string;
}

export interface ICheckoutLineItemRelationships {
  checkout?: { data: { id: string; type: string } };
  product?: { data: { id: string; type: string } };
  productUnit?: { data: { id: string; type: string } };
}

export interface ICheckoutLineItem {
  id: string;
  type: string;
  attributes: ICheckoutLineItemAttributes;
  relationships?: ICheckoutLineItemRelationships;
}

// Checkout interfaces
export interface ICheckoutAttributes {
  currency?: string;
  poNumber?: string;
  customerNotes?: string;
  shipUntil?: string;
  completed?: boolean;
  subtotal?: string;
  total?: string;
}

export interface ICheckoutRelationships {
  billingAddress?: { data: { id: string; type: string } | null };
  shippingAddress?: { data: { id: string; type: string } | null };
  customerUser?: { data: { id: string; type: string } | null };
  lineItems?: { data: Array<{ id: string; type: string }> };
}

export interface ICheckout {
  id: string;
  type: string;
  attributes: ICheckoutAttributes;
  relationships?: ICheckoutRelationships;
}

// Customer Address interfaces
export interface ICustomerAddressAttributes {
  label?: string;
  street?: string;
  street2?: string;
  city?: string;
  postalCode?: string;
  regionText?: string;
  namePrefix?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nameSuffix?: string;
  organization?: string;
  phone?: string;
  primary?: boolean;
}

export interface ICustomerAddress {
  id: string;
  type: string;
  attributes: ICustomerAddressAttributes;
  relationships?: {
    country?: { data: { type: string; id: string } };
    region?: { data: { type: string; id: string } };
  };
}

/**
 * Update checkout with billing address only
 * Uses PATCH /api/checkouts/{id} with included billing address
 */
export const updateCheckoutBillingAddressFromCustomer = async (params: {
  checkoutId: string;
  customerAddressId: string;
  addressData: ICustomerAddress;
}): Promise<{ data: ICheckout | null; error?: string }> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const billingAddressId = 'bl_addr_id';
    const attrs = params.addressData.attributes;

    // Extract country and region from customer address relationships
    const countryId = params.addressData.relationships?.country?.data?.id || 'US';
    const regionId = params.addressData.relationships?.region?.data?.id;

    const included: any[] = [
      {
        type: 'checkoutaddresses',
        id: billingAddressId,
        attributes: {
          label: attrs.label || 'Billing Address',
          street: attrs.street || '',
          ...(attrs.street2 && { street2: attrs.street2 }),
          city: attrs.city || '',
          postalCode: attrs.postalCode || '',
          firstName: attrs.firstName || '',
          lastName: attrs.lastName || '',
          ...(attrs.phone && { phone: attrs.phone }),
        },
        relationships: {
          country: {
            data: {
              type: 'countries',
              id: countryId,
            },
          },
          ...(regionId && {
            region: {
              data: {
                type: 'regions',
                id: regionId,
              },
            },
          }),
        },
      },
    ];

    const requestBody: any = {
      data: {
        type: 'checkouts',
        id: params.checkoutId,
        relationships: {
          billingAddress: {
            data: {
              type: 'checkoutaddresses',
              id: billingAddressId,
            },
          },
        },
      },
      included,
    };

    const response = await api.patch<IJsonApiResponse<ICheckout>>(
      `${CHECKOUTS_ENDPOINT}/${params.checkoutId}`,
      requestBody,
      config
    );

    const checkoutData = Array.isArray(response.data.data)
      ? response.data.data[0]
      : response.data.data;

    return { data: (checkoutData as unknown as ICheckout) || null };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.detail ||
      error.response?.data?.errors?.[0]?.title ||
      error.message ||
      'Failed to update billing address';
    return { data: null, error: errorMessage };
  }
};

/**
 * Update checkout with shipping address only
 * Uses PATCH /api/checkouts/{id} with included shipping address
 */
export const updateCheckoutShippingAddressFromCustomer = async (params: {
  checkoutId: string;
  customerAddressId: string;
  addressData: ICustomerAddress;
}): Promise<{ data: ICheckout | null; error?: string }> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const shippingAddressId = 'sh_addr_id';
    const attrs = params.addressData.attributes;

    // Extract country and region from customer address relationships
    const countryId = params.addressData.relationships?.country?.data?.id || 'US';
    const regionId = params.addressData.relationships?.region?.data?.id;

    const included: any[] = [
      {
        type: 'checkoutaddresses',
        id: shippingAddressId,
        attributes: {
          label: attrs.label || 'Shipping Address',
          street: attrs.street || '',
          ...(attrs.street2 && { street2: attrs.street2 }),
          city: attrs.city || '',
          postalCode: attrs.postalCode || '',
          firstName: attrs.firstName || '',
          lastName: attrs.lastName || '',
          ...(attrs.phone && { phone: attrs.phone }),
        },
        relationships: {
          country: {
            data: {
              type: 'countries',
              id: countryId,
            },
          },
          ...(regionId && {
            region: {
              data: {
                type: 'regions',
                id: regionId,
              },
            },
          }),
        },
      },
    ];

    const requestBody: any = {
      data: {
        type: 'checkouts',
        id: params.checkoutId,
        relationships: {
          shippingAddress: {
            data: {
              type: 'checkoutaddresses',
              id: shippingAddressId,
            },
          },
        },
      },
      included,
    };

    const response = await api.patch<IJsonApiResponse<ICheckout>>(
      `${CHECKOUTS_ENDPOINT}/${params.checkoutId}`,
      requestBody,
      config
    );

    const checkoutData = Array.isArray(response.data.data)
      ? response.data.data[0]
      : response.data.data;

    return { data: (checkoutData as unknown as ICheckout) || null };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.detail ||
      error.response?.data?.errors?.[0]?.title ||
      error.message ||
      'Failed to update shipping address';
    return { data: null, error: errorMessage };
  }
};

/**
 * Update checkout with shipping method
 */
export const updateCheckoutShippingMethod = async (
  checkoutId: string,
  shippingMethod: string
): Promise<{ data: ICheckout | null; error?: string }> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const requestBody = {
      data: {
        type: 'checkouts',
        id: checkoutId,
        attributes: {
          shippingMethod: shippingMethod,
        },
      },
    };

    const response = await api.patch<IJsonApiResponse<ICheckout>>(
      `${CHECKOUTS_ENDPOINT}/${checkoutId}`,
      requestBody,
      config
    );

    const checkoutData = Array.isArray(response.data.data)
      ? response.data.data[0]
      : response.data.data;

    return { data: (checkoutData as unknown as ICheckout) || null };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.detail ||
      error.response?.data?.errors?.[0]?.title ||
      error.response?.data?.message ||
      'Failed to update shipping method';
    return { data: null, error: errorMessage };
  }
};

/**
 * Update checkout with payment method
 */
export const updateCheckoutPaymentMethod = async (
  checkoutId: string,
  paymentMethod: string
): Promise<{ data: ICheckout | null; error?: string }> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const requestBody = {
      data: {
        type: 'checkouts',
        id: checkoutId,
        attributes: {
          paymentMethod: paymentMethod,
        },
      },
    };

    const response = await api.patch<IJsonApiResponse<ICheckout>>(
      `${CHECKOUTS_ENDPOINT}/${checkoutId}`,
      requestBody,
      config
    );

    const checkoutData = Array.isArray(response.data.data)
      ? response.data.data[0]
      : response.data.data;

    return { data: (checkoutData as unknown as ICheckout) || null };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.detail ||
      error.response?.data?.errors?.[0]?.title ||
      error.response?.data?.message ||
      'Failed to update payment method';
    return { data: null, error: errorMessage };
  }
};

/**
 * Execute payment for checkout
 */
export const executeCheckoutPayment = async (
  checkoutId: string,
  paymentMethod: string
): Promise<{ data: any | null; error?: string }> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    // Different endpoints for different payment methods
    let endpoint: string;
    if (paymentMethod.includes('payment_term') || paymentMethod.includes('PaymentTerm')) {
      endpoint = `${CHECKOUTS_ENDPOINT}/${checkoutId}/paymentPaymentTerm`;
    } else if (paymentMethod.includes('stripe')) {
      endpoint = `${CHECKOUTS_ENDPOINT}/${checkoutId}/paymentStripe`;
    } else if (paymentMethod.includes('paypal')) {
      endpoint = `${CHECKOUTS_ENDPOINT}/${checkoutId}/paymentPayPalExpress`;
    } else {
      // Default to payment term
      endpoint = `${CHECKOUTS_ENDPOINT}/${checkoutId}/paymentPaymentTerm`;
    }

    const response = await api.post<any>(endpoint, {}, config);

    return { data: response.data };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.detail ||
      error.response?.data?.errors?.[0]?.title ||
      error.response?.data?.message ||
      'Failed to execute payment';
    return { data: null, error: errorMessage };
  }
};

/**
 * Get available shipping methods for checkout
 */
export const getAvailableShippingMethods = async (
  checkoutId: string
): Promise<{ data: any[]; error?: string }> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const response = await api.get<IJsonApiListResponse<any>>(
      `${CHECKOUTS_ENDPOINT}/${checkoutId}/availableShippingMethods`,
      config
    );

    return { data: response.data.data || [] };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.title ||
      error.response?.data?.message ||
      'Failed to get shipping methods';
    return { data: [], error: errorMessage };
  }
};

/**
 * Get available payment methods for checkout
 */
export const getAvailablePaymentMethods = async (
  checkoutId: string
): Promise<{ data: any[]; error?: string }> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const response = await api.get<IJsonApiListResponse<any>>(
      `${CHECKOUTS_ENDPOINT}/${checkoutId}/availablePaymentMethods`,
      config
    );

    return { data: response.data.data || [] };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.title ||
      error.response?.data?.message ||
      'Failed to get payment methods';
    return { data: [], error: errorMessage };
  }
};

/**
 * Get customer addresses
 */
export const getCustomerAddresses = async (): Promise<{
  data: ICustomerAddress[];
  error?: string;
}> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    // Include country and region in the response
    const response = await api.get<IJsonApiListResponse<ICustomerAddress>>(
      `${CUSTOMER_ADDRESSES_ENDPOINT}?include=country,region`,
      config
    );

    return { data: (response.data.data as unknown as ICustomerAddress[]) || [] };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.title ||
      error.response?.data?.message ||
      'Failed to get customer addresses';
    return { data: [], error: errorMessage };
  }
};

/**
 * Create new customer address
 */
export const createCustomerAddress = async (
  addressData: Partial<ICustomerAddressAttributes> & { country?: string; region?: string }
): Promise<{ data: ICustomerAddress | null; error?: string }> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    // Extract country and region from addressData
    const { country, region, ...attributes } = addressData;

    const requestBody: any = {
      data: {
        type: 'customeraddresses',
        attributes: attributes,
        relationships: {},
      },
    };

    if (country) {
      requestBody.data.relationships.country = {
        data: {
          type: 'countries',
          id: country,
        },
      };
    }

    if (region) {
      requestBody.data.relationships.region = {
        data: {
          type: 'regions',
          id: region,
        },
      };
    }

    const response = await api.post<IJsonApiResponse<ICustomerAddress>>(
      CUSTOMER_ADDRESSES_ENDPOINT,
      requestBody,
      config
    );

    const addressDataResult = Array.isArray(response.data.data)
      ? response.data.data[0]
      : response.data.data;

    return { data: (addressDataResult as unknown as ICustomerAddress) || null };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.title ||
      error.response?.data?.message ||
      'Failed to create address';
    return { data: null, error: errorMessage };
  }
};

/**
 * Get countries list
 */
export const getCountries = async (): Promise<{
  data: Array<{ id: string; name: string }>;
  error?: string;
}> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const response = await api.get<IJsonApiListResponse<any>>(
      `${COUNTRIES_ENDPOINT}?page[number]=1&page[size]=250&sort=name`,
      config
    );

    const countries =
      response.data.data?.map((country: any) => ({
        id: country.id,
        name: country.attributes?.name || country.id,
      })) || [];

    return { data: countries };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.title ||
      error.response?.data?.message ||
      'Failed to get countries';
    return { data: [], error: errorMessage };
  }
};

/**
 * Get regions list for a specific country
 */
export const getRegions = async (
  countryCode: string
): Promise<{
  data: Array<{ id: string; name: string; code: string }>;
  error?: string;
}> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const response = await api.get<IJsonApiListResponse<any>>(
      `${REGIONS_ENDPOINT}?filter[country]=${countryCode}&page[number]=1&page[size]=100&sort=name`,
      config
    );

    const regions =
      response.data.data?.map((region: any) => ({
        id: region.id,
        name: region.attributes?.name || region.id,
        code: region.attributes?.code || region.id,
      })) || [];

    return { data: regions };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.title ||
      error.response?.data?.message ||
      'Failed to get regions';
    return { data: [], error: errorMessage };
  }
};
