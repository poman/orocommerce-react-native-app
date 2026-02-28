import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/src/context/ThemeContext';

const RECENTLY_VIEWED_KEY = 'app.recentlyViewed';

export interface RecentlyViewedItem {
  productId: string;
  productSku: string;
  viewedAt: number; // timestamp
}

/**
 * Get all recently viewed product SKUs
 * @returns Array of product SKUs, most recent first
 */
const getRecentlyViewedFromStorage = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!data) return [];

    const items: RecentlyViewedItem[] = JSON.parse(data);
    return items.sort((a, b) => b.viewedAt - a.viewedAt).map(item => item.productSku);
  } catch (_error) {
    return [];
  }
};

const addToRecentlyViewedStorage = async (productId: string, productSku: string, maxItems: number): Promise<void> => {
  try {
    const data = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
    let items: RecentlyViewedItem[] = data ? JSON.parse(data) : [];

    items = items.filter(item => item.productId !== productId);

    items.unshift({
      productId,
      productSku,
      viewedAt: Date.now(),
    });

    if (items.length > maxItems) {
      items = items.slice(0, maxItems);
    }

    await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));
  } catch (_error) {
    // Silent fail
  }
};

const clearAllRecentlyViewedStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch (_error) {
    // Silent fail
  }
};

/**
 * Standalone function to add a product to recently viewed
 * Use this in components that don't need the full hook
 * @param productId
 * @param productSku
 * @param maxItems - max items to keep in storage (defaults to 25)
 */
export const addRecentlyViewed = async (productId: string, productSku: string, maxItems = 25): Promise<void> => {
  await addToRecentlyViewedStorage(productId, productSku, maxItems);
};

export const useRecentlyViewed = () => {
  const { effectiveConfig } = useTheme();
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecentlyViewed = useCallback(async () => {
    setIsLoading(true);
    try {
      const skus = await getRecentlyViewedFromStorage();
      setRecentlyViewedIds(skus);
    } catch (_error) {
      setRecentlyViewedIds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentlyViewed();
  }, [loadRecentlyViewed]);

  const addToRecentlyViewed = useCallback(
    async (productId: string, productSku: string) => {
      await addToRecentlyViewedStorage(productId, productSku, effectiveConfig.recentlyViewed.listingRecentlyViewed);
      await loadRecentlyViewed();
    },
    [loadRecentlyViewed, effectiveConfig.recentlyViewed.listingRecentlyViewed]
  );

  const clearRecentlyViewed = useCallback(async () => {
    await clearAllRecentlyViewedStorage();
    setRecentlyViewedIds([]);
  }, []);

  return {
    recentlyViewedIds,
    isLoading,
    addRecentlyViewed: addToRecentlyViewed,
    clearRecentlyViewed,
    refetch: loadRecentlyViewed,
  };
};
