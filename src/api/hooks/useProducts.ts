import { useEffect, useState } from 'react';
import { getProducts, IProduct, IGetProductsParams } from '../helpers/products';
import { initializeApi, setAuthTokenGetter, setRefreshTokenFn } from '../api';

export interface IUseProductsResult {
  loading: boolean;
  error: any | null;
  products: IProduct[];
  total: number;
  refetch: () => void;
}

export function useProducts(
  params?: IGetProductsParams,
  baseUrl?: string,
  getValidAccessToken?: () => Promise<string | null>,
  refreshAccessToken?: () => Promise<boolean>
): IUseProductsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      if (!baseUrl || !params) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        initializeApi(baseUrl);
        if (getValidAccessToken) {
          setAuthTokenGetter(getValidAccessToken);
        }
        if (refreshAccessToken) {
          setRefreshTokenFn(refreshAccessToken);
        }

        const result = await getProducts(params);

        if (!mounted) return;

        setProducts(result.data);
        setTotal(result.total);
      } catch (e: any) {
        if (!mounted) return;

        setError(e);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, params, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return {
    loading,
    error,
    products,
    total,
    refetch,
  };
}
