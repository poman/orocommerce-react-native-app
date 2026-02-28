import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/src/context/ThemeContext';
import { ThemeColors } from '@/src/themes/types';

interface ProductCardSkeletonProps {
  width?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ width = 180 }) => {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  return (
    <View style={[styles.productCard, { width }]}>
      <Skeleton width="100%" height={180} borderRadius={0} />
      <View style={styles.productInfo}>
        <Skeleton width="100%" height={18} borderRadius={4} style={styles.titleSkeleton} />
        <Skeleton width="70%" height={18} borderRadius={4} style={styles.titleSkeleton} />
        <Skeleton width="40%" height={14} borderRadius={4} style={styles.skuSkeleton} />
        <Skeleton width="60%" height={20} borderRadius={4} style={styles.priceSkeleton} />
        <View style={styles.buttonRow}>
          <Skeleton width="48%" height={32} borderRadius={4} />
          <Skeleton width="48%" height={32} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  productCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    padding: 12,
  },
  titleSkeleton: {
    marginBottom: 4,
  },
  skuSkeleton: {
    marginBottom: 8,
  },
  priceSkeleton: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
