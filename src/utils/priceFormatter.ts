import { AppConfig } from '@/src/constants/config';

/**
 * Formats a price value with configured precision
 * @param price - The price value to format (string or number)
 * @returns Formatted price string
 */
export const formatPrice = (price?: string | number): string => {
  if (!price) return '0.00';
  return parseFloat(String(price)).toFixed(AppConfig.price.precision);
};

/**
 * Formats a discount value with proper sign handling
 * If the discount is negative, it displays with a minus sign
 * @param discount - The discount value from API (can be negative string like "-10.0000")
 * @returns Formatted discount string with sign and currency symbol (e.g., "-$10.00" or "$10.00")
 */
export const formatDiscount = (discount?: string | number): string => {
  if (!discount) return '$0.00';

  const discountValue = parseFloat(String(discount));
  const absoluteValue = Math.abs(discountValue);
  const formattedValue = absoluteValue.toFixed(AppConfig.price.precision);

  // If the original discount is negative, prepend the minus sign
  return discountValue < 0 ? `-$${formattedValue}` : `$${formattedValue}`;
};
