import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WISHLIST_STORAGE_KEY = 'app.wishlist';

interface WishlistItem {
  productId: string;
  productSku: string;
  addedAt: number;
}

interface ShopContextType {
  wishlist: string[];
  wishlistSkus: string[];
  toggleWishlist: (productId: string, productSku: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistSkus, setWishlistSkus] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const wishlistData = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);

        if (wishlistData) {
          const items: WishlistItem[] = JSON.parse(wishlistData);
          setWishlist(items.map(item => item.productId));
          setWishlistSkus(items.map(item => item.productSku));
        }
      } catch (_error) {
        setWishlist([]);
        setWishlistSkus([]);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const items: WishlistItem[] = wishlist.map((id, index) => ({
        productId: id,
        productSku: wishlistSkus[index] || '',
        addedAt: Date.now() - (wishlist.length - index) * 1000,
      }));

      AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
    }
  }, [wishlist, wishlistSkus, isLoaded]);

  const toggleWishlist = useCallback((productId: string, productSku: string) => {
    setWishlist(prev => {
      const isInList = prev.includes(productId);
      if (isInList) {
        setWishlistSkus(skus => skus.filter(sku => sku !== productSku));
        return prev.filter(id => id !== productId);
      } else {
        setWishlistSkus(skus => [...skus, productSku]);
        return [...prev, productId];
      }
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  const value = useMemo(
    () => ({
      wishlist,
      wishlistSkus,
      toggleWishlist,
      isInWishlist,
    }),
    [wishlist, wishlistSkus, toggleWishlist, isInWishlist]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
