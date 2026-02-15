import { useEffect, useState, useMemo } from 'react';
import { getProductsBySkus, IProduct } from '../helpers/products';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { initializeApi, setAuthTokenGetter, setRefreshTokenFn } from '../api';

export interface IUseWishlistProductsResult {
  loading: boolean;
  error: any | null;
  products: IProduct[];
  refetch: () => void;
}

export function useWishlistProducts(skus: string[]): IUseWishlistProductsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { baseUrl } = useConfig();
  const { getValidAccessToken, refreshAccessToken } = useAuth();

  const skusKey = useMemo(() => JSON.stringify(skus), [skus]);

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      if (!baseUrl) {
        setLoading(false);
        return;
      }

      const validSkus = skus.filter(sku => sku && sku.trim() !== '');

      if (validSkus.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        initializeApi(baseUrl);
        setAuthTokenGetter(getValidAccessToken);
        setRefreshTokenFn(refreshAccessToken);

        const result = await getProductsBySkus(validSkus, {
          page: { number: 1, size: 50 },
          sort: 'relevance',
          include: 'images,product.inventoryStatus',
        });

        if (!mounted) return;

        setProducts(result.data);
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
  }, [skusKey, refetchTrigger, baseUrl, getValidAccessToken, refreshAccessToken, skus]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return {
    loading,
    error,
    products,
    refetch,
  };
}
