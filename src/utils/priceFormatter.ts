import { AppConfig } from '@/src/themes/config';

/**
 * Formats a price value with configured precision.
 * @param price - The price value to format (string or number)
 * @param precision - Decimal places (defaults to AppConfig.price.precision, overridden by theme)
 * @returns Formatted price string
 */
export const formatPrice = (price?: string | number, precision?: number): string => {
  if (!price) return '0.00';
  const p = precision ?? AppConfig.price.precision;
  return parseFloat(String(price)).toFixed(p);
};

/**
 * Formats a discount value with proper sign handling.
 * @param discount - The discount value from API (can be negative string like "-10.0000")
 * @param precision - Decimal places (defaults to AppConfig.price.precision, overridden by theme)
 * @returns Formatted discount string with sign and currency symbol (e.g., "-$10.00" or "$10.00")
 */
export const formatDiscount = (discount?: string | number, precision?: number): string => {
  if (!discount) return '$0.00';

  const p = precision ?? AppConfig.price.precision;
  const discountValue = parseFloat(String(discount));
  const absoluteValue = Math.abs(discountValue);
  const formattedValue = absoluteValue.toFixed(p);

  return discountValue < 0 ? `-$${formattedValue}` : `$${formattedValue}`;
};
