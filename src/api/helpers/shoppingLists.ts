import api from '../api';
import { SHOPPING_LIST_ITEMS_ENDPOINT, SHOPPING_LISTS_ENDPOINT } from '../endpoints';
import { IJsonApiListResponse, IJsonApiResponse } from '../types';
import { Platform } from 'react-native';

export interface IShoppingListAttributes {
  name: string;
  notes?: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  default: boolean;
  total: string;
  subTotal: string;
  discount?: string | null;
}

export interface IShoppingListRelationships {
  items?: { data: Array<{ id: string; type: string }> };
  customerUser?: { data: { id: string; type: string } | null };
  customer?: { data: { id: string; type: string } | null };
}

export interface IShoppingList {
  id: string;
  type: string;
  attributes: IShoppingListAttributes;
  relationships?: IShoppingListRelationships;
}

export interface IShoppingListItemAttributes {
  quantity: number;
  notes?: string | null;
  value?: string; // Price per unit
  subTotal?: string; // Price before discount (quantity * value)
  totalValue?: string; // Final price after discount
  discount?: string; // Discount amount
}

export interface IShoppingListItemRelationships {
  shoppingList: { data: { id: string; type: string } };
  product: { data: { id: string; type: string } };
  unit: { data: { id: string; type: string } };
}

export interface IShoppingListItem {
  id: string;
  type: string;
  attributes: IShoppingListItemAttributes;
  relationships: IShoppingListItemRelationships;
}

export interface IGetShoppingListsParams {
  page?: {
    number?: number;
    size?: number;
  };
  sort?: string;
}

export interface ICreateShoppingListParams {
  name: string;
  notes?: string;
  default?: boolean;
}

export interface ICreateShoppingListItemParams {
  shoppingListId: string;
  productId: string;
  unitId: string;
  quantity: number;
  notes?: string;
}

export const getShoppingLists = async (
  params?: IGetShoppingListsParams
): Promise<{ data: IShoppingList[]; total: number; error?: string }> => {
  const queryParams = new URLSearchParams();

  if (params?.page?.number) {
    queryParams.append('page[number]', params.page.number.toString());
  }
  if (params?.page?.size) {
    queryParams.append('page[size]', params.page.size.toString());
  }
  if (params?.sort) {
    queryParams.append('sort', params.sort);
  }

  const url = `${SHOPPING_LISTS_ENDPOINT}?${queryParams.toString()}`;

  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const response = await api.get<IJsonApiListResponse<IShoppingList>>(url, config);

    const data = (Array.isArray(response.data.data)
      ? response.data.data
      : [response.data.data]) as unknown as IShoppingList[];

    // Sort to put default shopping list at the top
    const sortedData = data.sort((a, b) => {
      if (a.attributes.default && !b.attributes.default) return -1;
      if (!a.attributes.default && b.attributes.default) return 1;
      return 0;
    });

    return {
      data: sortedData,
      total: response.data.meta?.pagination?.total || data.length,
    };
  } catch (error: any) {
    if (error.response?.status === 401) {
      return {
        data: [],
        total: 0,
        error: 'Authentication required. Please log in to access shopping lists.',
      };
    }
    if (error.response?.status === 403) {
      const errorDetail =
        error.response?.data?.errors?.[0]?.detail || 'Access denied to shopping lists';
      return {
        data: [],
        total: 0,
        error: errorDetail,
      };
    }
    throw error;
  }
};

export const createShoppingList = async (
  params: ICreateShoppingListParams
): Promise<IShoppingList> => {
  const config = Platform.OS === 'web' ? { withCredentials: true } : {};

  const response = await api.post<IJsonApiResponse<IShoppingList>>(
    SHOPPING_LISTS_ENDPOINT,
    {
      data: {
        type: 'shoppinglists',
        attributes: {
          name: params.name,
          ...(params.notes && { notes: params.notes }),
          ...(params.default !== undefined && { default: params.default }),
        },
      },
    },
    config
  );

  return (Array.isArray(response.data.data)
    ? response.data.data[0]
    : response.data.data) as unknown as IShoppingList;
};

export const createShoppingListItem = async (
  params: ICreateShoppingListItemParams
): Promise<IShoppingListItem> => {
  const config = Platform.OS === 'web' ? { withCredentials: true } : {};

  try {
    const response = await api.post<IJsonApiResponse<IShoppingListItem>>(
      SHOPPING_LIST_ITEMS_ENDPOINT,
      {
        data: {
          type: 'shoppinglistitems',
          attributes: {
            quantity: params.quantity,
            ...(params.notes && { notes: params.notes }),
          },
          relationships: {
            shoppingList: {
              data: {
                type: 'shoppinglists',
                id: params.shoppingListId,
              },
            },
            product: {
              data: {
                type: 'products',
                id: params.productId,
              },
            },
            unit: {
              data: {
                type: 'productunits',
                id: params.unitId,
              },
            },
          },
        },
      },
      config
    );

    return (Array.isArray(response.data.data)
      ? response.data.data[0]
      : response.data.data) as unknown as IShoppingListItem;
  } catch (error: any) {
    // Handle 409 Conflict - item already exists in shopping list
    if (error.response?.status === 409) {
      const existingItems = await getShoppingListItems({
        shoppingListId: params.shoppingListId,
        page: { number: 1, size: 1000 },
      });

      // Find the item with same product and unit
      const existingItem = existingItems.data.find(
        item =>
          item.relationships.product.data.id === params.productId &&
          item.relationships.unit.data.id === params.unitId
      );

      if (existingItem) {
        const oldQuantity = existingItem.attributes.quantity;
        const newQuantity = oldQuantity + params.quantity;

        // Update the existing item with merged quantity
        return await updateShoppingListItem({
          itemId: existingItem.id,
          quantity: newQuantity,
          ...(params.notes && { notes: params.notes }),
        });
      } else {
        console.error('409 Conflict but could not find existing item to merge');
      }
    }
    throw error;
  }
};

export interface IGetShoppingListItemsParams {
  shoppingListId: string;
  page?: {
    number?: number;
    size?: number;
  };
  include?: string;
}

export const getShoppingListItems = async (
  params: IGetShoppingListItemsParams
): Promise<{ data: IShoppingListItem[]; total: number; included?: any[] }> => {
  const queryParams = new URLSearchParams();

  queryParams.append('filter[shoppingList]', params.shoppingListId);

  if (params?.page?.number) {
    queryParams.append('page[number]', params.page.number.toString());
  }
  if (params?.page?.size) {
    queryParams.append('page[size]', params.page.size.toString());
  }
  if (params?.include) {
    queryParams.append('include', params.include);
  }

  const url = `${SHOPPING_LIST_ITEMS_ENDPOINT}?${queryParams.toString()}`;

  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const response = await api.get<IJsonApiListResponse<IShoppingListItem>>(url, config);

    const data = (Array.isArray(response.data.data)
      ? response.data.data
      : [response.data.data]) as unknown as IShoppingListItem[];

    return {
      data,
      total: response.data.meta?.pagination?.total || data.length,
      included: response.data.included || [],
    };
  } catch (error: any) {
    if (error.response?.status === 401) {
      return {
        data: [],
        total: 0,
        included: [],
      };
    }
    throw error;
  }
};

export interface IUpdateShoppingListParams {
  id: string;
  name?: string;
  notes?: string;
  default?: boolean;
}

export const updateShoppingList = async (
  params: IUpdateShoppingListParams
): Promise<IShoppingList> => {
  const config = Platform.OS === 'web' ? { withCredentials: true } : {};

  const response = await api.patch<IJsonApiResponse<IShoppingList>>(
    `${SHOPPING_LISTS_ENDPOINT}/${params.id}`,
    {
      data: {
        type: 'shoppinglists',
        id: params.id,
        attributes: {
          ...(params.name !== undefined && { name: params.name }),
          ...(params.notes !== undefined && { notes: params.notes }),
          ...(params.default !== undefined && { default: params.default }),
        },
      },
    },
    config
  );

  return (Array.isArray(response.data.data)
    ? response.data.data[0]
    : response.data.data) as unknown as IShoppingList;
};

export const setShoppingListAsDefault = async (id: string): Promise<IShoppingList> => {
  return updateShoppingList({ id, default: true });
};

export const deleteShoppingList = async (id: string): Promise<void> => {
  const config = Platform.OS === 'web' ? { withCredentials: true } : {};
  await api.delete(`${SHOPPING_LISTS_ENDPOINT}/${id}`, config);
};

export const deleteShoppingListItem = async (itemId: string): Promise<void> => {
  const config = Platform.OS === 'web' ? { withCredentials: true } : {};
  await api.delete(`${SHOPPING_LIST_ITEMS_ENDPOINT}/${itemId}`, config);
};

export interface IUpdateShoppingListItemParams {
  itemId: string;
  quantity?: number;
  notes?: string;
  unitId?: string;
}

export const updateShoppingListItem = async (
  params: IUpdateShoppingListItemParams
): Promise<IShoppingListItem> => {
  const config = Platform.OS === 'web' ? { withCredentials: true } : {};

  const attributes: any = {};
  if (params.quantity !== undefined) {
    attributes.quantity = params.quantity;
  }
  if (params.notes !== undefined) {
    attributes.notes = params.notes;
  }

  const relationships: any = {};
  if (params.unitId) {
    relationships.unit = {
      data: {
        type: 'productunits',
        id: params.unitId,
      },
    };
  }

  const response = await api.patch<IJsonApiResponse<IShoppingListItem>>(
    `${SHOPPING_LIST_ITEMS_ENDPOINT}/${params.itemId}`,
    {
      data: {
        type: 'shoppinglistitems',
        id: params.itemId,
        ...(Object.keys(attributes).length > 0 && { attributes }),
        ...(Object.keys(relationships).length > 0 && { relationships }),
      },
    },
    config
  );

  return (Array.isArray(response.data.data)
    ? response.data.data[0]
    : response.data.data) as unknown as IShoppingListItem;
};

/**
 * Create checkout from shopping list
 * POST /api/shoppinglists/{id}/checkout
 * Returns the created checkout
 */
export const createCheckoutFromShoppingList = async (
  shoppingListId: string
): Promise<{ data: any; error?: string }> => {
  try {
    const config = Platform.OS === 'web' ? { withCredentials: true } : {};

    const response = await api.post<any>(
      `${SHOPPING_LISTS_ENDPOINT}/${shoppingListId}/checkout`,
      {},
      config
    );

    return {
      data: Array.isArray(response.data.data) ? response.data.data[0] : response.data.data,
    };
  } catch (error: any) {
    return {
      data: null,
      error:
        error.response?.data?.errors?.[0]?.detail ||
        error.message ||
        'Failed to create checkout from shopping list',
    };
  }
};
