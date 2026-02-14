import { useEffect, useState } from 'react';
import { getOrders, IOrder, IGetOrdersParams } from '../helpers/orders';
import { initializeApi, setAuthTokenGetter, setRefreshTokenFn } from '../api';

export interface IUseOrdersResult {
  loading: boolean;
  error: string | null;
  orders: IOrder[];
  total: number;
  included: any[];
  refetch: () => void;
}

export function useOrders(
  params?: IGetOrdersParams,
  baseUrl?: string,
  getValidAccessToken?: () => Promise<string | null>,
  refreshAccessToken?: () => Promise<boolean>
): IUseOrdersResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [included, setIncluded] = useState<any[]>([]);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      // Skip fetching if params is undefined (guest user)
      if (!params) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (baseUrl) {
          initializeApi(baseUrl);
          if (getValidAccessToken) {
            setAuthTokenGetter(getValidAccessToken);
          }
          if (refreshAccessToken) {
            setRefreshTokenFn(refreshAccessToken);
          }
        }

        const result = await getOrders(params);

        if (!mounted) return;

        setOrders(result.data);
        setTotal(result.total);
        setIncluded(result.included || []);
      } catch (e: any) {
        if (!mounted) return;

        setError(e?.response?.data?.errors?.[0]?.detail || e?.message || 'Failed to load orders');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params?.page?.number,
    params?.page?.size,
    params?.include,
    params?.sort,
    params?.fields,
    params?.filter,
    refetchTrigger,
    baseUrl,
    getValidAccessToken,
  ]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return {
    loading,
    error,
    orders,
    total,
    included,
    refetch,
  };
}
