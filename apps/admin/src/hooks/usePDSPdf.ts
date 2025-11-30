/**
 * Admin Portal PDS PDF Hook
 *
 * This hook wraps the employee portal's PDF generation functionality
 * for use in the admin portal. It also re-exports the transformation
 * function needed to convert PDS submission data to PDF format.
 */

// Re-export the hook and types from employee portal
export {
  usePDSPdf,
  type UsePDSPdfReturn
} from '../../../employee/src/hooks/usePDSPdf';

// Re-export the transformation utility from employee portal
export { transformPdsForPdf } from '../../../employee/src/lib/utils/pds-transformations';
