/**
 * PDS PDF Generation Module
 * CS Form No. 212 (Revised 2025)
 *
 * Export all components, types, styles, and utilities for PDS PDF generation
 */

// Main document component
export { PDSDocument, default } from './PDSDocument';

// Individual page components
export { default as PDSPage1 } from './PDSPage1';
export { default as PDSPage2 } from './PDSPage2';
export { default as PDSPage3 } from './PDSPage3';
export { default as PDSPage4 } from './PDSPage4';

// Types
export type {
  Address,
  PersonalInfo,
  FamilyBackground,
  Child,
  Education,
  CivilServiceEligibility,
  WorkExperience,
  VoluntaryWork,
  Training,
  Recognition,
  Association,
  Reference,
  PDSQuestions,
  GovernmentID,
  PDSData,
} from './types';

// Styles and helper functions
export {
  styles,
  colors,
  dimensions,
  formatDate,
  formatDateMMDDYYYY,
  formatCurrency,
  isEmpty,
  displayOrNA,
  displayOrEmpty,
} from './PDSStyles';
