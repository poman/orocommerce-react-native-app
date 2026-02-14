import api from '../api';
import { ORDERS_ENDPOINT } from '../endpoints';
import { IJsonApiListResponse, IJsonApiData, IQueryParams } from '../types';

export interface IOrderLineItemAttributes {
  productSku: string;
  productName: string;
  quantity: number;
  price: string;
  currency: string;
  value: string;
  shipBy?: string;
  productUnit: string;
  productUnitLabel?: string;
}

export interface IOrderAddressAttributes {
  label?: string;
  organization?: string;
  namePrefix?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nameSuffix?: string;
  street?: string;
  street2?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
}

export interface IOrderAttributes {
  identifier: string;
  poNumber?: string;
  shipUntil?: string;
  currency: string;
  subtotalValue: string;
  totalValue: string;
  createdAt: string;
  updatedAt: string;
  customerNotes?: string;
  shippingMethod?: string;
  shippingMethodType?: string;
  estimatedShippingCostAmount?: string;
  overriddenShippingCostAmount?: string;
  totalDiscountsAmount?: string;
  [key: string]: any;
}

export interface IOrderRelationships {
  lineItems?: { data: Array<{ id: string; type: string }> };
  billingAddress?: { data: { id: string; type: string } | null };
  shippingAddress?: { data: { id: string; type: string } | null };
  paymentStatus?: { data: { id: string; type: string } | null };
  internalStatus?: { data: { id: string; type: string } | null };
}

// Extended Order type with parsed included data
export interface IOrder {
  id: string;
  type: string;
  attributes: IOrderAttributes;
  relationships?: any;
  lineItems?: Array<IJsonApiData<IOrderLineItemAttributes>>;
  billingAddress?: IJsonApiData<IOrderAddressAttributes>;
  shippingAddress?: IJsonApiData<IOrderAddressAttributes>;
}

export interface IGetOrdersParams extends IQueryParams {
  page?: {
    number?: number;
    size?: number;
  };
  include?: string;
  fields?: Record<string, string>;
  sort?: string;
  filter?: {
    [key: string]: any;
  };
}

export const getOrders = async (
  params?: IGetOrdersParams
): Promise<{ data: IOrder[]; total: number; included?: any[] }> => {
  const queryParams = new URLSearchParams();

  // Pagination
  if (params?.page?.number) {
    queryParams.append('page[number]', params.page.number.toString());
  }
  if (params?.page?.size) {
    queryParams.append('page[size]', params.page.size.toString());
  }

  const includeParams =
    params?.include || 'lineItems,billingAddress,shippingAddress,internalStatus';
  queryParams.append('include', includeParams);

  if (params?.fields) {
    Object.entries(params.fields).forEach(([key, value]) => {
      queryParams.append(`fields[${key}]`, value);
    });
  }

  // Sort (default: newest first)
  const sortParam = params?.sort || '-createdAt';
  queryParams.append('sort', sortParam);

  if (params?.filter) {
    Object.entries(params.filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(`filter[${key}]`, String(value));
      }
    });
  }

  const url = `${ORDERS_ENDPOINT}?${queryParams.toString()}`;
  const response = await api.get<IJsonApiListResponse<IOrderAttributes, IOrderRelationships>>(url);

  const orders = response.data.data || [];
  const included = response.data.included || [];
  const total = response.data.meta?.totalCount || orders.length;

  // Parse included data (line items, addresses, etc.)
  const parsedOrders: IOrder[] = orders.map(order => {
    const parsedOrder: IOrder = {
      id: order.id,
      type: order.type,
      attributes: order.attributes as IOrderAttributes,
      relationships: order.relationships,
    };

    // Parse line items
    if (order.relationships?.lineItems?.data && Array.isArray(order.relationships.lineItems.data)) {
      const lineItemIds = order.relationships.lineItems.data.map((item: any) => item.id);
      parsedOrder.lineItems = included.filter(
        (inc: any) => inc.type === 'orderlineitems' && lineItemIds.includes(inc.id)
      );
    }

    // Parse billing address
    if (
      order.relationships?.billingAddress?.data &&
      !Array.isArray(order.relationships.billingAddress.data)
    ) {
      const addressId = (order.relationships.billingAddress.data as any).id;
      parsedOrder.billingAddress = included.find(
        (inc: any) => inc.type === 'orderaddresses' && inc.id === addressId
      );
    }

    // Parse shipping address
    if (
      order.relationships?.shippingAddress?.data &&
      !Array.isArray(order.relationships.shippingAddress.data)
    ) {
      const addressId = (order.relationships.shippingAddress.data as any).id;
      parsedOrder.shippingAddress = included.find(
        (inc: any) => inc.type === 'orderaddresses' && inc.id === addressId
      );
    }

    return parsedOrder;
  });

  return {
    data: parsedOrders,
    total,
    included,
  };
};

export const getOrderById = async (orderId: string, include?: string): Promise<IOrder> => {
  const queryParams = new URLSearchParams();

  const includeParams =
    include ||
    'lineItems,lineItems.product,lineItems.product.images,lineItems.product.inventoryStatus,billingAddress,shippingAddress,status,internalStatus,paymentStatus';
  queryParams.append('include', includeParams);

  const url = `${ORDERS_ENDPOINT}/${orderId}?${queryParams.toString()}`;
  const response = await api.get<{
    data: IJsonApiData<IOrderAttributes, IOrderRelationships>;
    included?: any[];
  }>(url);

  const order = response.data.data;
  const included = response.data.included || [];

  const parsedOrder: IOrder = {
    id: order.id,
    type: order.type,
    attributes: order.attributes as IOrderAttributes,
    relationships: order.relationships,
  };

  // Parse line items
  if (order.relationships?.lineItems?.data && Array.isArray(order.relationships.lineItems.data)) {
    const lineItemIds = order.relationships.lineItems.data.map((item: any) => item.id);
    parsedOrder.lineItems = included.filter(
      (inc: any) => inc.type === 'orderlineitems' && lineItemIds.includes(inc.id)
    );
  }

  // Parse billing address
  if (
    order.relationships?.billingAddress?.data &&
    !Array.isArray(order.relationships.billingAddress.data)
  ) {
    const addressId = (order.relationships.billingAddress.data as any).id;
    parsedOrder.billingAddress = included.find(
      (inc: any) => inc.type === 'orderaddresses' && inc.id === addressId
    );
  }

  // Parse shipping address
  if (
    order.relationships?.shippingAddress?.data &&
    !Array.isArray(order.relationships.shippingAddress.data)
  ) {
    const addressId = (order.relationships.shippingAddress.data as any).id;
    parsedOrder.shippingAddress = included.find(
      (inc: any) => inc.type === 'orderaddresses' && inc.id === addressId
    );
  }

  (parsedOrder as any).included = included;

  return parsedOrder;
};
