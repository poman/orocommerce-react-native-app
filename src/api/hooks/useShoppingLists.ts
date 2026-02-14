import { useState, useEffect } from 'react';
import {
  getShoppingLists,
  createShoppingList,
  createShoppingListItem,
  IShoppingList,
  IGetShoppingListsParams,
  ICreateShoppingListParams,
  ICreateShoppingListItemParams,
} from '../helpers/shoppingLists';
import { initializeApi, setAuthTokenGetter, setRefreshTokenFn } from '../api';

export interface IUseShoppingListsResult {
  loading: boolean;
  error: string | null;
  shoppingLists: IShoppingList[];
  defaultList: IShoppingList | null;
  refetch: () => Promise<void>;
  createList: (params: ICreateShoppingListParams) => Promise<IShoppingList | null>;
  addItemToList: (params: ICreateShoppingListItemParams) => Promise<boolean>;
}

export const useShoppingLists = (
  params?: IGetShoppingListsParams,
  baseUrl?: string,
  getValidAccessToken?: () => Promise<string | null>,
  refreshAccessToken?: () => Promise<boolean>
): IUseShoppingListsResult => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shoppingLists, setShoppingLists] = useState<IShoppingList[]>([]);
  const [defaultList, setDefaultList] = useState<IShoppingList | null>(null);

  const fetchShoppingLists = async () => {
    try {
      setLoading(true);
      setError(null);

      if (baseUrl) {
        initializeApi(baseUrl);
        if (getValidAccessToken) {
          setAuthTokenGetter(getValidAccessToken);
        }
        if (refreshAccessToken) {
          setRefreshTokenFn(refreshAccessToken);
        }
      }

      const result = await getShoppingLists(params);

      if (result.error) {
        setError(result.error);
        setShoppingLists([]);
        setDefaultList(null);
      } else {
        setShoppingLists(result.data);
        // Find the default shopping list
        const defaultSL = result.data.find(sl => sl.attributes.default);
        setDefaultList(defaultSL || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shopping lists');
      setShoppingLists([]);
      setDefaultList(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShoppingLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, getValidAccessToken]);

  const createList = async (
    listParams: ICreateShoppingListParams
  ): Promise<IShoppingList | null> => {
    try {
      const newList = await createShoppingList(listParams);
      await fetchShoppingLists(); // Refresh the list
      return newList;
    } catch (err: any) {
      setError(err.message || 'Failed to create shopping list');
      return null;
    }
  };

  const addItemToList = async (itemParams: ICreateShoppingListItemParams): Promise<boolean> => {
    try {
      await createShoppingListItem(itemParams);
      await fetchShoppingLists(); // Refresh to update totals
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to add item to shopping list');
      return false;
    }
  };

  return {
    loading,
    error,
    shoppingLists,
    defaultList,
    refetch: fetchShoppingLists,
    createList,
    addItemToList,
  };
};
