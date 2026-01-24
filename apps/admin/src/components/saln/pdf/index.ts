/**
 * SALN PDF Components
 *
 * Re-export all SALN PDF generation components and utilities from shared package
 * Based on CSC SALN Form 2019 (Revised)
 *
 * This file now acts as a re-export layer for the centralized SALN PDF implementation
 * in @tupsafe/shared-ui/saln-pdf. All components, types, and utilities are maintained
 * in the shared package to ensure consistency across admin and employee portals.
 */

// Re-export all SALN PDF components and utilities from shared package
export {
  // SALN Document
  SALNDocument,
  registerSALNFonts,
  // Types
  type SALNData,
  type RealProperty,
  type PersonalProperty,
  type CashAccount,
  type Liability,
  type BusinessInterest,
  type RelativeInGovernment,
} from '@tupsafe/shared-ui';
