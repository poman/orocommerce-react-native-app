import { useState, useEffect, useCallback } from 'react';
import { searchProducts, IProduct } from '../helpers/products';

interface UseProductSearchParams {
  searchQuery: string;
  page?: {
    number: number;
    size: number;
  };
  sort?: string;
}

interface UseProductSearchResult {
  loading: boolean;
  error: string | null;
  products: IProduct[];
  total: number;
  refetch: () => void;
}

/**
 * Hook for searching products using the /api/productsearch endpoint
 *
 * @param params - Search parameters including searchQuery, page, and sort
 * @returns Search results with loading state
 */
export function useProductSearch(params: UseProductSearchParams): UseProductSearchResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    if (!params.searchQuery || params.searchQuery.trim() === '') {
      setProducts([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchQuery = `allText ~ "${params.searchQuery.trim()}"`;

      const result = await searchProducts({
        searchQuery,
        page: params.page || { number: 1, size: 20 },
        sort: params.sort || 'relevance',
      });

      setProducts(result.products);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Failed to search products');
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.searchQuery, params.page?.number, params.page?.size, params.sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    loading,
    error,
    products,
    total,
    refetch,
  };
}
