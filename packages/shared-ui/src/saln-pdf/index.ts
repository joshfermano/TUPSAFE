/**
 * SALN PDF Generation Module
 *
 * This module provides components and utilities for generating CSC-compliant
 * SALN (Statement of Assets, Liabilities and Net Worth) PDFs.
 *
 * CSC Compliance Updates (January 2015):
 * - Currency format: "P" prefix instead of "₱" symbol
 * - Currency color: Black (#000000) instead of green
 * - Font family: Liberation Serif instead of Roboto
 * - Table headers: Light gray (#E0E0E0) with black text
 * - Form title: Underlined
 * - CSC header: Resolution info at top-right
 * - Page size: LETTER (8.5" x 11")
 *
 * @module saln-pdf
 */

// Main document component
export { SALNDocument } from './SALNDocument';

// Individual page components
export { SALNPage1 } from './SALNPage1';
export { SALNPage2 } from './SALNPage2';
export { SALNPage3, shouldRenderSALNPage3 } from './SALNPage3';
export { SALNPage4, shouldRenderSALNPage4 } from './SALNPage4';

// 2025 Format ANNEX components
export { SALNAnnexB, shouldRenderAnnexB } from './SALNAnnexB';
export { SALNAnnexC, shouldRenderAnnexC } from './SALNAnnexC';

// Styles and utilities
export {
  styles,
  SALN_COLORS,
  SALN_FONT_SIZES,
  SALN_DIMENSIONS,
  registerSALNFonts,
  ensureSALNFontsRegistered,
  formatCurrency,
  formatDate,
  displayOrEmpty,
  calculateAge,
  sumArray,
  calculateRealPropertiesTotal,
  calculatePersonalPropertiesTotal,
  calculateLiabilitiesTotal,
  calculateTotalAssets,
  calculateNetWorth,
  formatCurrencyAbbreviated,
  isEmpty,
  formatYear,
} from './SALNStyles';

// Type definitions
export type {
  SALNData,
  DeclarantInfo,
  SpouseInfo,
  ChildInfo,
  RealProperty,
  PersonalProperty,
  Liability,
  BusinessInterest,
  RelativeInGov,
  GovernmentID,
  FilingType,
  ValidationResult,
  PDFGenerationOptions,
  YearOverYearComparison,
  SectionSummary,
  // 2025 Format types
  ComplianceType,
  PropertyOwner,
  UnmarriedChild,
} from './types';
