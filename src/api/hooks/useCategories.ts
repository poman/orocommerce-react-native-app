import { useState, useEffect } from 'react';
import { initializeApi, setAuthTokenGetter, setRefreshTokenFn } from '../api';
import { getCategories, ICategory, IGetCategoriesParams } from '../helpers/categories';

export const useCategories = (
  params?: IGetCategoriesParams,
  baseUrl?: string,
  getValidAccessToken?: () => Promise<string | null>,
  refreshAccessToken?: () => Promise<boolean>
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [total, setTotal] = useState(0);

  const fetchCategories = async () => {
    if (!baseUrl) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      initializeApi(baseUrl);
      if (getValidAccessToken) {
        setAuthTokenGetter(getValidAccessToken);
      }
      if (refreshAccessToken) {
        setRefreshTokenFn(refreshAccessToken);
      }

      const result = await getCategories(params);
      setCategories(result.data);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, params]);

  const refetch = () => {
    fetchCategories();
  };

  return {
    loading,
    error,
    categories,
    total,
    refetch,
  };
};
