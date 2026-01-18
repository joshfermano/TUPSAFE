// Export utils
export { cn } from './lib/utils';

// Export all UI components
export * from './ui/animated-gradient-text';
export * from './ui/animated-grid-pattern';
export * from './ui/animated-shiny-text';
export * from './ui/aurora-text';
export * from './ui/avatar';
export * from './ui/badge';
export * from './ui/border-beam';
export * from './ui/button';
export * from './ui/card';
export * from './ui/checkbox';
export * from './ui/collapsible';
export * from './ui/form';
export * from './ui/globe';
export * from './ui/grid-pattern';
export * from './ui/input-otp';
export * from './ui/input';
export * from './ui/label';
export * from './ui/magic-card';
export * from './ui/meteors';
export * from './ui/navigation-menu';
export * from './ui/neon-gradient-card';
export * from './ui/number-ticker';
export * from './ui/select';
export * from './ui/separator';
export * from './ui/sheet';
export * from './ui/textarea';

// Export MagicUI components
export * from './ui/shimmer-button';
export * from './ui/shiny-button';
export * from './ui/pulsating-button';
export * from './ui/interactive-hover-button';
export * from './ui/shine-border';
export * from './ui/blur-fade';
export * from './ui/text-animate';
export * from './ui/sparkles-text';
export * from './ui/dot-pattern';
export * from './ui/flickering-grid';
export * from './ui/retro-grid';
export * from './ui/particles';

// Export Enhanced Components
export * from './ui/enhanced-button';
export * from './ui/enhanced-card';
export * from './ui/enhanced-form-section';
export * from './ui/enhanced-input';
export * from './ui/enhanced-select';
export * from './ui/enhanced-text-field';
export * from './ui/enhanced-background';
export * from './ui/enhanced-success';

// Export PDF fonts utility
export * from './fonts';

// Export SALN PDF components and utilities
export * from './saln-pdf';

// Export PDS PDF components and utilities
export * from './pds-pdf';

// Export Report PDF components and utilities (with explicit re-exports to avoid conflicts)
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