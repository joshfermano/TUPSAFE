/**
 * Formatting Helper Functions
 *
 * Utility functions for formatting data in view pages
 */

import type { Address, Citizenship } from '@tupsafe/database';

/**
 * Format address object to string
 */
export function formatAddress(
  address:
    | Address
    | { street?: string; city?: string; province?: string; zipCode?: string }
    | undefined
    | null
): string {
  if (!address) return 'N/A';
  const parts = [address.street, address.city, address.province, address.zipCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
}

/**
 * Format citizenship
 */
export function formatCitizenship(citizenship: Record<string, any> | undefined | null): string {
  if (!citizenship) return 'Filipino';
  if (citizenship.type === 'Filipino') return 'Filipino';
  if (citizenship.type === 'Dual') {
    const methodStr = citizenship.acquisitionMethod === 'byBirth' ? 'By Birth' : 
                      citizenship.acquisitionMethod === 'byNaturalization' ? 'By Naturalization' :
                      citizenship.acquisitionMethod;
    const countryStr = citizenship.country || citizenship.details;
    const parts = [];
    if (methodStr) parts.push(methodStr);
    if (countryStr) parts.push(countryStr);
    
    return parts.length > 0 ? `Dual Citizenship (${parts.join(' - ')})` : 'Dual Citizenship';
  }
  return citizenship.type || 'Filipino';
}

/**
 * Format currency in Philippine Peso
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === null || amount === undefined) return '₱0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Format date range for employment/training periods
 */
export function formatDateRange(
  from: Date | string | null | undefined,
  to: Date | string | null | undefined,
  isPresent?: boolean
): string {
  if (!from) return 'N/A';

  const fromDate = new Date(from);
  const fromStr = fromDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  if (isPresent) return `${fromStr} - Present`;
  if (!to) return fromStr;

  const toDate = new Date(to);
  const toStr = toDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return `${fromStr} - ${toStr}`;
}

/**
 * Format year range for education periods
 */
export function formatYearRange(
  from: Date | string | null | undefined,
  to: Date | string | null | undefined
): string {
  if (!from && !to) return 'N/A';

  const fromYear = from ? new Date(from).getFullYear() : null;
  const toYear = to ? new Date(to).getFullYear() : null;

  if (!fromYear && toYear) return toYear.toString();
  if (fromYear && !toYear) return fromYear.toString();
  if (fromYear && toYear) return `${fromYear} - ${toYear}`;

  return 'N/A';
}

/**
 * Format boolean to Yes/No
 */
export function formatBoolean(value: boolean | undefined | null): string {
  if (value === null || value === undefined) return 'N/A';
  return value ? 'Yes' : 'No';
}

/**
 * Format height in meters
 */
export function formatHeight(heightM: number | undefined | null): string {
  if (heightM === null || heightM === undefined) return 'N/A';
  return `${heightM.toFixed(2)} m`;
}

/**
 * Format weight in kilograms
 */
export function formatWeight(weightKg: number | undefined | null): string {
  if (weightKg === null || weightKg === undefined) return 'N/A';
  return `${weightKg.toFixed(1)} kg`;
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Safely capitalize the first letter of a string with null/undefined handling
 * @param str - The string to capitalize
 * @param fallback - Fallback value if str is null/undefined (default: 'N/A')
 * @returns Capitalized string or fallback value
 *
 * @example
 * capitalize('pending') // 'Pending'
 * capitalize(null) // 'N/A'
 * capitalize(undefined, 'Unknown') // 'Unknown'
 */
export function capitalize(
  str: string | undefined | null,
  fallback: string = 'N/A'
): string {
  if (!str || typeof str !== 'string') return fallback;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
