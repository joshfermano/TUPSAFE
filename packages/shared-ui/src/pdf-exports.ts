/**
 * PDF-specific exports from @tupsafe/shared-ui
 *
 * This module consolidates all PDF-related exports (SALN, PDS, Report PDFs, and fonts)
 * into a single entry point. Consumers that only need PDF functionality should import
 * from '@tupsafe/shared-ui/pdf' to avoid pulling in UI components and their dependencies.
 *
 * Bundle impact: @react-pdf/renderer adds ~50KB+ to the client bundle.
 * By separating PDF exports, pages that don't generate PDFs avoid this cost entirely.
 *
 * @module pdf-exports
 */

// ============================================================================
// PDF Font Utilities
// ============================================================================
export {
  DEFAULT_FONT_PATHS,
  type FontPaths,
  registerPDFFonts,
  ensurePDFFontsRegistered,
  resetFontRegistration,
} from './fonts';

// ============================================================================
// SALN PDF Components and Utilities
// ============================================================================
export * from './saln-pdf';

// ============================================================================
// PDS PDF Components and Utilities
// ============================================================================
export * from './pds-pdf';

// ============================================================================
// Report PDF Components and Utilities
// ============================================================================
export type {
  ReportType,
  ReportData,
  ReportMetadata,
  ReportDocumentProps,
  ReportHeaderProps,
  ReportTableProps,
  ReportFooterProps,
} from './report-pdf/types';

export {
  reportStyles,
  REPORT_COLORS,
  REPORT_DIMENSIONS,
  REPORT_FONT_SIZES,
  registerReportFonts,
  ensureReportFontsRegistered,
  formatReportDate,
  formatReportDateTime,
  displayOrNA,
} from './report-pdf/ReportStyles';

export {
  ReportHeader,
  TableHeader,
  ReportFooter,
} from './report-pdf/ReportComponents';

export {
  ReportDocument,
  calculateColumnWidths,
  validateReportData,
} from './report-pdf/ReportDocument';
