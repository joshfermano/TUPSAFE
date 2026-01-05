/**
 * PDS PDF Generation Package
 * Shared utilities for generating CS Form No. 212 (Revised 2025) PDFs
 *
 * This module provides all components, utilities, and types needed to generate
 * CSC-compliant Personal Data Sheet PDFs.
 *
 * @module pds-pdf
 */

// ============================================================================
// Type Definitions
// ============================================================================
// Export all types with PDS prefix to avoid conflicts with SALN types
export type {
  Address as PDSAddress,
  PersonalInfo as PDSPersonalInfo,
  FamilyBackground as PDSFamilyBackground,
  Child as PDSChild,
  Education as PDSEducation,
  CivilServiceEligibility as PDSCivilServiceEligibility,
  WorkExperience as PDSWorkExperience,
  VoluntaryWork as PDSVoluntaryWork,
  Training as PDSTraining,
  Recognition as PDSRecognition,
  Association as PDSAssociation,
  Reference as PDSReference,
  PDSQuestions,
  GovernmentID as PDSGovernmentID,
  PDSData,
} from './types';

// ============================================================================
// Styles, Constants, and Utilities
// ============================================================================
export {
  // Font registration
  registerPDSFonts,
  ensurePDSFontsRegistered,
  // Constants
  PDS_COLORS,
  PDS_DIMENSIONS,
  PDS_FONT_SIZES,
  // StyleSheet (renamed to avoid conflict with SALN)
  styles as pdsStyles,
  // Utility functions (renamed to avoid conflicts)
  formatDate as pdsFormatDate,
  displayOrEmpty as pdsDisplayOrEmpty,
  formatFullName as pdsFormatFullName,
  isEmpty as pdsIsEmpty,
  displayOrNA as pdsDisplayOrNA,
  formatCurrency as pdsFormatCurrency,
} from './PDSStyles';

// ============================================================================
// Reusable Components
// ============================================================================
export {
  // Page structure
  PDSPageHeader,
  PDSFormTitle,
  PDSPageFooter,
  // Section headers
  SectionHeader,
  SubSectionHeader,
  // Table components
  TableRow,
  EmptyTableRow,
  TableHeaderRow,
  // Cell components
  FieldCell,
  LabelCell,
  FieldWithLabel,
  MultiColumnRow,
  // Text components
  ContinueText,
  DeclarationText,
  InstructionText,
  // Form elements
  CheckboxField,
  // Specialized components
  PhotoBox,
  ThumbmarkBox,
  SignatureBox,
  // Helpers
  SectionDivider,
} from './PDSComponents';

// ============================================================================
// Page Components
// ============================================================================
export { PDSPage1 } from './PDSPage1';
export { PDSPage2 } from './PDSPage2';
export { PDSPage3 } from './PDSPage3';
export { PDSPage4 } from './PDSPage4';

// ============================================================================
// Main Document Component
// ============================================================================
export { PDSDocument } from './PDSDocument';
