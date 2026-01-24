/**
 * SALN Review Components
 *
 * Clean, minimalistic components for displaying SALN submission data
 * in the admin portal review interface.
 */

// Re-export shared components for backwards compatibility
export { DataField, DataSection } from '@/components/shared';

// SALN-specific components
export { FinancialSummaryCards } from './FinancialSummaryCards';
export { PropertyCard } from './PropertyCard';

// Re-export PDF components for convenience
export * from './pdf';
