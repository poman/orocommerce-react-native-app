import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { ThemeColors } from '@/src/themes/types';
import {
  groupAndSortTierPrices,
  formatQuantity,
  formatTierPrice,
  TierPrice,
} from '@/src/utils/tierPrices';

interface TierPricesTableProps {
  prices: TierPrice[] | undefined;
  title?: string;
  defaultUnit?: string;
  containerStyle?: ViewStyle;
  compact?: boolean;
  noBorder?: boolean;
}

/**
 * Reusable component for displaying tier prices in a table format
 * Can be used in product details, search results, shopping lists, etc.
 */
export const TierPricesTable: React.FC<TierPricesTableProps> = ({
  prices,
  title = 'Volume Pricing',
  defaultUnit = 'item',
  containerStyle,
  compact = false,
  noBorder = false,
}) => {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const groupedPrices = groupAndSortTierPrices(prices, defaultUnit);

  if (groupedPrices.length === 0) {
    return null;
  }

  if (compact) {
    // Compact inline version for search results
    const compactStyle = noBorder
      ? [styles.compactContainer, styles.compactContainerNoBorder, containerStyle]
      : [styles.compactContainer, containerStyle];

    return (
      <View style={compactStyle}>
        {groupedPrices.map(({ unit, prices: tierPrices }) => (
          <View key={unit} style={styles.compactUnitSection}>
            <Text style={styles.compactUnitLabel}>{unit}:</Text>
            <View style={styles.compactPricesList}>
              {tierPrices.map((tier, idx) => (
                <View key={idx} style={styles.compactPriceRow}>
                  <Text style={styles.compactQty}>{formatQuantity(tier.quantity)}</Text>
                  <Text style={styles.compactPrice}>
                    {formatTierPrice(tier.price, tier.currencyId)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  // Full table version for product details
  return (
    <View style={[styles.container, containerStyle]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.header}>
          <Text style={styles.headerCell}>Quantity</Text>
          <Text style={styles.headerCell}>Unit</Text>
          <Text style={[styles.headerCell, styles.headerCellRight]}>Price</Text>
        </View>

        {/* Table Rows */}
        {groupedPrices.map(({ unit, prices: tierPrices }) =>
          tierPrices.map((tier, idx) => (
            <View key={`${unit}-${idx}`} style={styles.row}>
              <Text style={styles.cell}>{formatQuantity(tier.quantity)}</Text>
              <Text style={styles.cell}>{idx === 0 ? unit : ''}</Text>
              <Text style={[styles.cell, styles.cellRight]}>
                {formatTierPrice(tier.price, tier.currencyId)}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  // Full table styles
  container: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 12,
  },
  table: {
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: ShopColors.primary + '10',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  headerCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: ShopColors.text,
  },
  headerCellRight: {
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: ShopColors.background,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: ShopColors.text,
  },
  cellRight: {
    textAlign: 'right',
    fontWeight: '600',
    color: ShopColors.primary,
  },

  // Compact inline styles
  compactContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
  },
  compactContainerNoBorder: {
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  compactUnitSection: {
    marginBottom: 6,
  },
  compactUnitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 4,
  },
  compactPricesList: {
    gap: 2,
  },
  compactPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  compactQty: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  compactPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.text,
  },
});
