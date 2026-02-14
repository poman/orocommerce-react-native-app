import { useEffect, useState } from 'react';
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
          page: { number: 1, size: 50 }, // Get up to 50 wishlist items
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skus.length, skus, refetchTrigger, baseUrl, getValidAccessToken]);

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
