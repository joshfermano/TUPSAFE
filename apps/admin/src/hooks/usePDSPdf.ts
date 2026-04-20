/**
 * Admin Portal PDS PDF Hook
 *
 * Provides functionality for generating, downloading, and previewing
 * PDS (Personal Data Sheet) forms as PDF documents using the shared
 * PDS PDF package.
 *
 * Uses dynamic imports for @react-pdf/renderer and PDF components
 * to avoid loading ~50KB+ of PDF libraries on pages that don't
 * immediately need PDF generation.
 *
 * @module hooks/usePDSPdf
 */

import { useState, useCallback } from 'react';
import type { PDSData } from '@tupsafe/shared-ui';

// Re-export the transformation utility from employee portal
// This stays in employee app as it's specific to form data transformation
export { transformPdsForPdf } from '../../../employee/src/lib/utils/pds-transformations';

// ============================================================================
// Types
// ============================================================================

export interface UsePDSPdfReturn {
  /**
   * Generate a PDF blob from PDS data
   * @param data - The PDS data to generate PDF from
   * @returns Promise resolving to a Blob containing the PDF
   */
  generatePDF: (data: PDSData) => Promise<Blob>;

  /**
   * Generate PDF and trigger browser download
   * @param data - The PDS data to generate PDF from
   * @param filename - Optional custom filename (defaults to PDS_LastName_FirstName_Date.pdf)
   */
  downloadPDF: (data: PDSData, filename?: string) => Promise<void>;

  /**
   * Generate PDF and open in a new browser tab
   * @param data - The PDS data to generate PDF from
   */
  openPDFInNewTab: (data: PDSData) => Promise<void>;

  /**
   * Whether a PDF generation operation is in progress
   */
  isGenerating: boolean;

  /**
   * Error that occurred during PDF generation, if any
   */
  error: Error | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a default filename for the PDS PDF
 * Format: PDS_LastName_FirstName_YYYYMMDD.pdf
 * Throws error if required fields are missing
 */
function generateDefaultFilename(pdsData: PDSData): string {
  const surname = pdsData.personalInfo.surname;
  const firstName = pdsData.personalInfo.firstName;

  if (!surname || !firstName) {
    throw new Error(
      'Cannot generate PDF: Name fields are required. Please ensure surname and first name are filled in the PDS submission.'
    );
  }

  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');

  // Sanitize names for filename (remove special characters)
  const sanitizedSurname = surname.replace(/[^a-zA-Z0-9]/g, '');
  const sanitizedFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '');

  return `PDS_${sanitizedSurname}_${sanitizedFirstName}_${date}.pdf`;
}

/**
 * Trigger a browser download for a blob
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the object URL after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for generating PDS PDF documents
 *
 * PDF libraries (@react-pdf/renderer, PDS document components) are loaded
 * on-demand via dynamic imports when generatePDF is first called, keeping
 * the initial page bundle lean.
 *
 * @returns Object containing PDF generation functions and state
 */
export function usePDSPdf(): UsePDSPdfReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Generate a PDF blob from PDS data
   * Dynamically imports @react-pdf/renderer and PDS components on first call
   */
  const generatePDF = useCallback(async (data: PDSData): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Validate required fields
      if (!data.personalInfo?.surname || !data.personalInfo?.firstName) {
        throw new Error(
          'Cannot generate PDF: Personal information must include surname and firstName'
        );
      }

      // Dynamically import pdf-lib template filler via deep subpath
      // (NOT the barrel — barrel must stay free of pdf-lib transitive imports)
      const { fillPDS } = await import('@tupsafe/shared-ui/pds-template/pds-filler');

      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : '';

      // Fill the government PDF template with data using pdf-lib
      const pdfBytes = await fillPDS(baseUrl, data);

      // Cast: pdf-lib returns Uint8Array<ArrayBufferLike>, Blob needs ArrayBuffer
      return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to generate PDF');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Generate PDF and trigger browser download
   */
  const downloadPDF = useCallback(
    async (data: PDSData, filename?: string): Promise<void> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Generate the PDF blob
        const blob = await generatePDF(data);

        // Use provided filename or generate default
        const finalFilename = filename || generateDefaultFilename(data);

        // Trigger the download
        triggerDownload(blob, finalFilename);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to download PDF');
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [generatePDF]
  );

  /**
   * Generate PDF and open in a new browser tab
   */
  const openPDFInNewTab = useCallback(
    async (data: PDSData): Promise<void> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Generate the PDF blob
        const blob = await generatePDF(data);

        // Create an object URL for the blob
        const url = URL.createObjectURL(blob);

        // Open in a new tab
        const newTab = window.open(url, '_blank');

        if (!newTab) {
          throw new Error(
            'Failed to open new tab. Please allow pop-ups for this site.'
          );
        }

        // Clean up the object URL after a delay
        // Note: We delay cleanup to ensure the PDF loads in the new tab
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to open PDF preview');
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [generatePDF]
  );

  return {
    generatePDF,
    downloadPDF,
    openPDFInNewTab,
    isGenerating,
    error,
  };
}

export default usePDSPdf;
