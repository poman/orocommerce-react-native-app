/**
 * Utility functions for handling tier prices across the app
 */

export interface TierPrice {
  price: string;
  currencyId: string;
  quantity: string;
  unit: string;
}

export interface GroupedTierPrices {
  unit: string;
  prices: TierPrice[];
}

/**
 * Groups tier prices by unit and sorts them by quantity
 * @param prices - Array of tier prices
 * @param defaultUnit - Fallback unit if not specified (default: 'item')
 * @returns Array of grouped and sorted tier prices
 */
export function groupAndSortTierPrices(
  prices: TierPrice[] | undefined,
  defaultUnit: string = 'item'
): GroupedTierPrices[] {
  if (!prices || prices.length === 0) {
    return [];
  }

  // Group prices by unit
  const pricesByUnit = new Map<string, TierPrice[]>();
  prices.forEach(price => {
    const unit = price.unit || defaultUnit;
    if (!pricesByUnit.has(unit)) {
      pricesByUnit.set(unit, []);
    }
    pricesByUnit.get(unit)!.push(price);
  });

  // Sort prices within each unit by quantity
  pricesByUnit.forEach(tierPrices => {
    tierPrices.sort((a, b) => parseFloat(a.quantity) - parseFloat(b.quantity));
  });

  // Convert to array of grouped prices
  return Array.from(pricesByUnit.entries()).map(([unit, prices]) => ({
    unit,
    prices,
  }));
}

/**
 * Formats quantity for display (e.g., "1" -> "1+", "5" -> "5+")
 * @param quantity - Quantity string or number
 * @returns Formatted quantity string
 */
export function formatQuantity(quantity: string | number): string {
  const qty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  return qty === 1 ? '1+' : `${quantity}+`;
}

/**
 * Gets currency symbol from currency ID
 * @param currencyId - Currency ID (e.g., 'USD', 'EUR', 'GBP')
 * @returns Currency symbol
 */
export function getCurrencySymbol(currencyId: string): string {
  switch (currencyId) {
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'USD':
    default:
      return '$';
  }
}

/**
 * Formats price with currency symbol
 * @param price - Price value (string or number)
 * @param currencyId - Currency ID
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string
 */
export function formatTierPrice(
  price: string | number,
  currencyId: string,
  decimals: number = 2
): string {
  const priceValue = typeof price === 'string' ? parseFloat(price) : price;
  const symbol = getCurrencySymbol(currencyId);
  return `${symbol}${priceValue.toFixed(decimals)}`;
}
