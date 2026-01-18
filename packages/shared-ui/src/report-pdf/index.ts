/**
 * TUPSAFE Report PDF Generation
 * Export all components, types, and utilities for generating professional reports
 */

// Types
export type {
  ReportType,
  ReportData,
  ReportMetadata,
  ReportDocumentProps,
  ReportHeaderProps,
  ReportTableProps,
  ReportFooterProps,
} from './types';

// Styles and utilities
export {
  reportStyles,
  REPORT_COLORS,
  REPORT_DIMENSIONS,
  REPORT_FONT_SIZES,
  registerReportFonts,
  ensureReportFontsRegistered,
  formatReportDate,
  formatReportDateTime,
  displayOrEmpty,
  displayOrNA,
} from './ReportStyles';

// Components
export {
  ReportHeader,
  TableHeader,
  TableRow,
  EmptyTableRow,
  ReportFooter,
  SectionHeader,
} from './ReportComponents';

// Main document
export {
  ReportDocument,
  calculateColumnWidths,
  validateReportData,
} from './ReportDocument';
